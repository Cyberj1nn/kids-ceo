import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs/promises';
import { query } from '../db/pool';
import { authJWT } from '../middleware/auth';
import { roleCheck } from '../middleware/roleCheck';
import { AuthRequest } from '../types';

const router = Router();
const ADMIN_ROLES = roleCheck(['superadmin', 'admin', 'mentor']);

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// MIME-типы и лимиты
const ALLOWED_MIMES: Record<string, { fileType: string; maxSize: number }> = {
  'image/jpeg': { fileType: 'image', maxSize: 10 * 1024 * 1024 },
  'image/png': { fileType: 'image', maxSize: 10 * 1024 * 1024 },
  'image/gif': { fileType: 'image', maxSize: 10 * 1024 * 1024 },
  'image/webp': { fileType: 'image', maxSize: 10 * 1024 * 1024 },
  'application/pdf': { fileType: 'pdf', maxSize: 50 * 1024 * 1024 },
  'audio/mpeg': { fileType: 'audio', maxSize: 100 * 1024 * 1024 },
  'audio/mp4': { fileType: 'audio', maxSize: 100 * 1024 * 1024 },
  'audio/ogg': { fileType: 'audio', maxSize: 100 * 1024 * 1024 },
  'audio/wav': { fileType: 'audio', maxSize: 100 * 1024 * 1024 },
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = crypto.randomBytes(16).toString('hex');
    cb(null, `${name}${ext}`);
  },
});

const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
    }
  },
}).single('file');

// Multer error handler
function handleMulterError(err: any, _req: Request, res: Response, next: NextFunction): void {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'Файл слишком большой' });
      return;
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({ error: 'Недопустимый тип файла. Разрешены: изображения, PDF, аудио' });
      return;
    }
    res.status(400).json({ error: err.message });
    return;
  }
  next(err);
}

// ========================
// POST /api/upload
// ========================
router.post(
  '/',
  authJWT,
  ADMIN_ROLES,
  uploadMiddleware,
  handleMulterError,
  async (req: AuthRequest, res: Response) => {
    try {
      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) {
        res.status(400).json({ error: 'Файл не прикреплён' });
        return;
      }

      const contentItemId = req.body.contentItemId;
      const mimeInfo = ALLOWED_MIMES[file.mimetype];

      // Проверка размера по типу
      if (mimeInfo && file.size > mimeInfo.maxSize) {
        await fs.unlink(file.path).catch(() => {});
        const maxMb = Math.round(mimeInfo.maxSize / 1024 / 1024);
        res.status(400).json({ error: `Файл слишком большой для этого типа (макс. ${maxMb} МБ)` });
        return;
      }

      const fileType = mimeInfo?.fileType || 'other';
      const fileUrl = `/uploads/${file.filename}`;

      if (contentItemId) {
        const { rows: contentRows } = await query(
          'SELECT id FROM content_items WHERE id = $1 AND deleted_at IS NULL',
          [contentItemId]
        );
        if (contentRows.length === 0) {
          await fs.unlink(file.path).catch(() => {});
          res.status(400).json({ error: 'Материал не найден' });
          return;
        }

        const { rows } = await query(
          `INSERT INTO attachments (content_item_id, file_type, file_url, file_size, original_name)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, file_type AS "fileType", file_url AS "fileUrl",
                     file_size AS "fileSize", original_name AS "originalName"`,
          [contentItemId, fileType, fileUrl, file.size, file.originalname]
        );

        res.status(201).json(rows[0]);
      } else {
        res.status(201).json({
          fileUrl,
          fileType,
          fileSize: file.size,
          originalName: file.originalname,
        });
      }
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }
);

// ========================
// DELETE /api/upload/:id
// ========================
router.delete(
  '/:id',
  authJWT,
  ADMIN_ROLES,
  async (req: AuthRequest, res: Response) => {
    try {
      const { rows } = await query(
        'SELECT id, file_url FROM attachments WHERE id = $1',
        [req.params.id as string]
      );

      if (rows.length === 0) {
        res.status(404).json({ error: 'Вложение не найдено' });
        return;
      }

      const filePath = path.join(__dirname, '..', rows[0].file_url);
      await fs.unlink(filePath).catch(() => {});
      await query('DELETE FROM attachments WHERE id = $1', [req.params.id as string]);

      res.json({ message: 'Вложение удалено' });
    } catch (err) {
      console.error('Delete attachment error:', err);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }
);

export default router;
