import { Response, NextFunction } from 'express';
import { query } from '../db/pool';
import { AuthRequest } from '../types';

/**
 * Проверяет, есть ли у пользователя доступ к вкладке.
 * admin/mentor/superadmin — доступ ко всем вкладкам.
 * user — только если есть запись в user_tab_access.
 *
 * Ожидает tabId в req.params.tabId или req.tabId (устанавливается ранее в цепочке).
 */
export function tabAccessCheck(getTabId: (req: AuthRequest) => Promise<number | null>) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, role } = req.user!;

      // Админы/наставники/суперадмин — доступ ко всем
      if (role === 'superadmin' || role === 'admin' || role === 'mentor') {
        next();
        return;
      }

      const tabId = await getTabId(req);
      if (!tabId) {
        res.status(404).json({ error: 'Вкладка не найдена' });
        return;
      }

      const { rows } = await query(
        'SELECT 1 FROM user_tab_access WHERE user_id = $1 AND tab_id = $2',
        [userId, tabId]
      );

      if (rows.length === 0) {
        res.status(403).json({ error: 'Нет доступа к этой вкладке' });
        return;
      }

      next();
    } catch (err) {
      console.error('Tab access check error:', err);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  };
}
