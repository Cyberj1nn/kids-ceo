import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config';
import { query } from '../db/pool';
import { authJWT } from '../middleware/auth';
import { AuthRequest, JwtPayload } from '../types';

const router = Router();

function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiresIn,
  } as jwt.SignOptions);
}

function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function parseExpiresIn(value: string): number {
  const match = value.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7d
  const num = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return num * (multipliers[unit] || 86400000);
}

// ========================
// POST /api/auth/login
// ========================
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      res.status(400).json({ error: 'Логин и пароль обязательны' });
      return;
    }

    const { rows } = await query(
      'SELECT id, first_name, last_name, login, password_hash, role FROM users WHERE login = $1 AND deleted_at IS NULL',
      [login]
    );

    if (rows.length === 0) {
      res.status(401).json({ error: 'Неверный логин или пароль' });
      return;
    }

    const user = rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      res.status(401).json({ error: 'Неверный логин или пароль' });
      return;
    }

    // Access token
    const accessToken = generateAccessToken({ userId: user.id, role: user.role });

    // Refresh token
    const refreshToken = generateRefreshToken();
    const refreshHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + parseExpiresIn(config.jwt.refreshExpiresIn));

    await query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshHash, expiresAt]
    );

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        login: user.login,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ========================
// POST /api/auth/refresh
// ========================
router.post('/refresh', async (req: AuthRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token обязателен' });
      return;
    }

    const tokenHash = hashToken(refreshToken);

    const { rows } = await query(
      `SELECT rt.id, rt.user_id, rt.expires_at, u.role
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1 AND u.deleted_at IS NULL`,
      [tokenHash]
    );

    if (rows.length === 0) {
      res.status(401).json({ error: 'Невалидный refresh token' });
      return;
    }

    const record = rows[0];

    if (new Date(record.expires_at) < new Date()) {
      await query('DELETE FROM refresh_tokens WHERE id = $1', [record.id]);
      res.status(401).json({ error: 'Refresh token истёк' });
      return;
    }

    // Ротация: удаляем старый, создаём новый
    await query('DELETE FROM refresh_tokens WHERE id = $1', [record.id]);

    const newAccessToken = generateAccessToken({ userId: record.user_id, role: record.role });
    const newRefreshToken = generateRefreshToken();
    const newRefreshHash = hashToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + parseExpiresIn(config.jwt.refreshExpiresIn));

    await query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [record.user_id, newRefreshHash, expiresAt]
    );

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ========================
// POST /api/auth/logout
// ========================
router.post('/logout', authJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
    } else {
      // Удалить все refresh-токены пользователя
      await query('DELETE FROM refresh_tokens WHERE user_id = $1', [req.user!.userId]);
    }

    res.json({ message: 'Выход выполнен' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ========================
// GET /api/auth/me
// ========================
router.get('/me', authJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await query(
      'SELECT id, first_name, last_name, login, role FROM users WHERE id = $1 AND deleted_at IS NULL',
      [req.user!.userId]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    const user = rows[0];
    res.json({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      login: user.login,
      role: user.role,
    });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

export default router;
