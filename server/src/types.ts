import { Request } from 'express';

export type UserRole = 'user' | 'admin' | 'superadmin' | 'mentor';

export interface JwtPayload {
  userId: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}
