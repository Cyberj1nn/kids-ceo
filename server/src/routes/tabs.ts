import { Router, Response } from 'express';
import { query } from '../db/pool';
import { authJWT } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

// GET /api/tabs — список доступных вкладок для текущего пользователя
router.get('/', authJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, role } = req.user!;

    let rows;

    if (role === 'superadmin' || role === 'admin' || role === 'mentor') {
      // Админы/наставники/суперадмин видят все вкладки
      const result = await query(
        'SELECT id, slug, name, sort_order AS "sortOrder" FROM tabs ORDER BY sort_order'
      );
      rows = result.rows;
    } else {
      // Обычные пользователи — публичные вкладки + те, к которым явно открыт доступ
      const PUBLIC_TAB_SLUGS = ['calendar'];
      const result = await query(
        `SELECT DISTINCT t.id, t.slug, t.name, t.sort_order AS "sortOrder"
         FROM tabs t
         LEFT JOIN user_tab_access uta ON uta.tab_id = t.id AND uta.user_id = $1
         WHERE uta.user_id IS NOT NULL OR t.slug = ANY($2::text[])
         ORDER BY t.sort_order`,
        [userId, PUBLIC_TAB_SLUGS]
      );
      rows = result.rows;
    }

    res.json(rows);
  } catch (err) {
    console.error('Tabs error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

export default router;
