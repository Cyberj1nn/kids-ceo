import { Response, NextFunction } from 'express';
import { AuthRequest, UserRole } from '../types';

export function roleCheck(allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Недостаточно прав' });
      return;
    }

    next();
  };
}
