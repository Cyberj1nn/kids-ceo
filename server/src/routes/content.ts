import { Router, Response } from 'express';
import { pool, query } from '../db/pool';
import { authJWT } from '../middleware/auth';
import { roleCheck } from '../middleware/roleCheck';
import { tabAccessCheck } from '../middleware/tabAccess';
import { AuthRequest } from '../types';

const router = Router();

const ADMIN_ROLES = roleCheck(['superadmin', 'admin', 'mentor']);

// ========================
// GET /api/tabs/:slug/categories
// Список подкатегорий вкладки
// ========================
router.get(
  '/tabs/:slug/categories',
  authJWT,
  tabAccessCheck(async (req) => {
    const { rows } = await query('SELECT id FROM tabs WHERE slug = $1', [req.params.slug as string]);
    return rows[0]?.id || null;
  }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { rows: tabRows } = await query('SELECT id FROM tabs WHERE slug = $1', [req.params.slug as string]);
      if (tabRows.length === 0) {
        res.status(404).json({ error: 'Вкладка не найдена' });
        return;
      }

      const { rows } = await query(
        `SELECT id, name, slug, sort_order AS "sortOrder", parent_id AS "parentId"
         FROM categories WHERE tab_id = $1 ORDER BY sort_order`,
        [tabRows[0].id]
      );

      res.json(rows);
    } catch (err) {
      console.error('Categories error:', err);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }
);

// ========================
// GET /api/categories/:id/content
// Список контента в подкатегории (пагинация)
// ========================
router.get(
  '/categories/:id/content',
  authJWT,
  tabAccessCheck(async (req) => {
    const { rows } = await query('SELECT tab_id FROM categories WHERE id = $1', [req.params.id as string]);
    return rows[0]?.tab_id || null;
  }),
  async (req: AuthRequest, res: Response) => {
    try {
      const categoryId = parseInt(req.params.id as string, 10);
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
      const offset = (page - 1) * limit;

      const { rows } = await query(
        `SELECT ci.id, ci.title, ci.content_type AS "contentType", ci.video_url AS "videoUrl",
                ci.sort_order AS "sortOrder", ci.created_at AS "createdAt",
                u.first_name || ' ' || u.last_name AS "authorName"
         FROM content_items ci
         JOIN users u ON u.id = ci.author_id
         WHERE ci.category_id = $1 AND ci.deleted_at IS NULL
         ORDER BY ci.sort_order, ci.created_at DESC
         LIMIT $2 OFFSET $3`,
        [categoryId, limit, offset]
      );

      const { rows: countRows } = await query(
        'SELECT COUNT(*) FROM content_items WHERE category_id = $1 AND deleted_at IS NULL',
        [categoryId]
      );

      res.json({
        items: rows,
        total: parseInt(countRows[0].count, 10),
        page,
        limit,
      });
    } catch (err) {
      console.error('Content list error:', err);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }
);

// ========================
// GET /api/tabs/:slug/content
// Контент вкладок БЕЗ подкатегорий (Подкасты, Книги, Фильмы)
// ========================
router.get(
  '/tabs/:slug/content',
  authJWT,
  tabAccessCheck(async (req) => {
    const { rows } = await query('SELECT id FROM tabs WHERE slug = $1', [req.params.slug as string]);
    return rows[0]?.id || null;
  }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { rows: tabRows } = await query('SELECT id FROM tabs WHERE slug = $1', [req.params.slug as string]);
      if (tabRows.length === 0) {
        res.status(404).json({ error: 'Вкладка не найдена' });
        return;
      }

      const tabId = tabRows[0].id;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
      const offset = (page - 1) * limit;

      const { rows } = await query(
        `SELECT ci.id, ci.title, ci.content_type AS "contentType", ci.video_url AS "videoUrl",
                ci.sort_order AS "sortOrder", ci.created_at AS "createdAt",
                u.first_name || ' ' || u.last_name AS "authorName"
         FROM content_items ci
         JOIN users u ON u.id = ci.author_id
         WHERE ci.tab_id = $1 AND ci.category_id IS NULL AND ci.deleted_at IS NULL
         ORDER BY ci.sort_order, ci.created_at DESC
         LIMIT $2 OFFSET $3`,
        [tabId, limit, offset]
      );

      const { rows: countRows } = await query(
        'SELECT COUNT(*) FROM content_items WHERE tab_id = $1 AND category_id IS NULL AND deleted_at IS NULL',
        [tabId]
      );

      res.json({
        items: rows,
        total: parseInt(countRows[0].count, 10),
        page,
        limit,
      });
    } catch (err) {
      console.error('Tab content error:', err);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }
);

// ========================
// GET /api/content/:id
// Конкретный материал с вложениями
// ========================
router.get(
  '/content/:id',
  authJWT,
  tabAccessCheck(async (req) => {
    const { rows } = await query('SELECT tab_id FROM content_items WHERE id = $1', [req.params.id as string]);
    return rows[0]?.tab_id || null;
  }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { rows } = await query(
        `SELECT ci.id, ci.title, ci.body, ci.blocks,
                ci.content_type AS "contentType",
                ci.video_url AS "videoUrl", ci.sort_order AS "sortOrder",
                ci.category_id AS "categoryId", ci.tab_id AS "tabId",
                ci.created_at AS "createdAt", ci.updated_at AS "updatedAt",
                u.first_name || ' ' || u.last_name AS "authorName"
         FROM content_items ci
         JOIN users u ON u.id = ci.author_id
         WHERE ci.id = $1 AND ci.deleted_at IS NULL`,
        [req.params.id as string]
      );

      if (rows.length === 0) {
        res.status(404).json({ error: 'Материал не найден' });
        return;
      }

      const { rows: attachments } = await query(
        `SELECT id, file_type AS "fileType", file_url AS "fileUrl",
                file_size AS "fileSize", original_name AS "originalName",
                uploaded_at AS "uploadedAt"
         FROM attachments WHERE content_item_id = $1
         ORDER BY uploaded_at`,
        [req.params.id as string]
      );

      res.json({ ...rows[0], attachments });
    } catch (err) {
      console.error('Content detail error:', err);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }
);

// ========================
// POST /api/content
// Создание материала (admin/mentor/superadmin)
// ========================
router.post(
  '/content',
  authJWT,
  ADMIN_ROLES,
  async (req: AuthRequest, res: Response) => {
    try {
      const { title, body, contentType, videoUrl, blocks, categoryId, tabId, sortOrder } = req.body;

      if (!title || !tabId) {
        res.status(400).json({ error: 'Заголовок и tabId обязательны' });
        return;
      }

      // Проверяем, что вкладка существует
      const { rows: tabRows } = await query('SELECT id FROM tabs WHERE id = $1', [tabId]);
      if (tabRows.length === 0) {
        res.status(400).json({ error: 'Вкладка не найдена' });
        return;
      }

      // Если указана категория — проверяем принадлежность к вкладке
      if (categoryId) {
        const { rows: catRows } = await query(
          'SELECT id FROM categories WHERE id = $1 AND tab_id = $2',
          [categoryId, tabId]
        );
        if (catRows.length === 0) {
          res.status(400).json({ error: 'Категория не принадлежит данной вкладке' });
          return;
        }
      }

      // Если переданы blocks — определяем contentType автоматически
      let resolvedContentType = contentType || 'text';
      if (blocks && Array.isArray(blocks)) {
        const hasVideo = blocks.some((b: any) => b.type === 'video');
        resolvedContentType = hasVideo ? 'video' : 'text';
      } else if (videoUrl) {
        resolvedContentType = 'video';
      }

      const blocksJson = blocks && Array.isArray(blocks) ? JSON.stringify(blocks) : null;

      const { rows } = await query(
        `INSERT INTO content_items (title, body, content_type, video_url, blocks, category_id, tab_id, author_id, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, title, content_type AS "contentType", created_at AS "createdAt"`,
        [
          title,
          body || '',
          resolvedContentType,
          videoUrl || null,
          blocksJson,
          categoryId || null,
          tabId,
          req.user!.userId,
          sortOrder || 0,
        ]
      );

      res.status(201).json(rows[0]);
    } catch (err) {
      console.error('Content create error:', err);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }
);

// ========================
// PUT /api/content/:id
// Редактирование материала (admin/mentor/superadmin)
// ========================
router.put(
  '/content/:id',
  authJWT,
  ADMIN_ROLES,
  async (req: AuthRequest, res: Response) => {
    try {
      const { title, body, contentType, videoUrl, blocks, sortOrder } = req.body;

      const { rows: existing } = await query(
        'SELECT id FROM content_items WHERE id = $1 AND deleted_at IS NULL',
        [req.params.id as string]
      );
      if (existing.length === 0) {
        res.status(404).json({ error: 'Материал не найден' });
        return;
      }

      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (title !== undefined) { fields.push(`title = $${idx++}`); values.push(title); }
      if (body !== undefined) { fields.push(`body = $${idx++}`); values.push(body); }
      if (blocks !== undefined) {
        fields.push(`blocks = $${idx++}`);
        values.push(blocks !== null ? JSON.stringify(blocks) : null);
        // Автоматически обновляем content_type при наличии blocks
        const hasVideo = Array.isArray(blocks) && blocks.some((b: any) => b.type === 'video');
        fields.push(`content_type = $${idx++}`);
        values.push(hasVideo ? 'video' : 'text');
      } else {
        if (contentType !== undefined) { fields.push(`content_type = $${idx++}`); values.push(contentType); }
      }
      if (videoUrl !== undefined) { fields.push(`video_url = $${idx++}`); values.push(videoUrl || null); }
      if (sortOrder !== undefined) { fields.push(`sort_order = $${idx++}`); values.push(sortOrder); }

      if (fields.length === 0) {
        res.status(400).json({ error: 'Нет полей для обновления' });
        return;
      }

      values.push(req.params.id as string);
      const { rows } = await query(
        `UPDATE content_items SET ${fields.join(', ')} WHERE id = $${idx}
         RETURNING id, title, content_type AS "contentType", updated_at AS "updatedAt"`,
        values
      );

      res.json(rows[0]);
    } catch (err) {
      console.error('Content update error:', err);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }
);

// ========================
// PATCH /api/content/reorder
// Массовое обновление sort_order (admin/mentor/superadmin)
// body: { items: [{ id: string, sortOrder: number }, ...] }
// ========================
router.patch(
  '/content/reorder',
  authJWT,
  ADMIN_ROLES,
  async (req: AuthRequest, res: Response) => {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Не передан список элементов' });
      return;
    }

    for (const item of items) {
      if (!item || typeof item.id !== 'string' || typeof item.sortOrder !== 'number') {
        res.status(400).json({ error: 'Неверный формат элементов: ожидается { id, sortOrder }' });
        return;
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const item of items) {
        await client.query(
          'UPDATE content_items SET sort_order = $1 WHERE id = $2 AND deleted_at IS NULL',
          [item.sortOrder, item.id]
        );
      }
      await client.query('COMMIT');
      res.json({ updated: items.length });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('Content reorder error:', err);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    } finally {
      client.release();
    }
  }
);

// ========================
// DELETE /api/content/:id
// Мягкое удаление материала (admin/mentor/superadmin)
// ========================
router.delete(
  '/content/:id',
  authJWT,
  ADMIN_ROLES,
  async (req: AuthRequest, res: Response) => {
    try {
      const { rows } = await query(
        `UPDATE content_items SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL
         RETURNING id`,
        [req.params.id as string]
      );

      if (rows.length === 0) {
        res.status(404).json({ error: 'Материал не найден' });
        return;
      }

      res.json({ message: 'Материал удалён' });
    } catch (err) {
      console.error('Content delete error:', err);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }
);

export default router;
