import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'kids_ceo',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  // Нужно для fallback-запроса email через Robokassa REST API (OpStateExt),
  // когда Robokassa не передаёт Email в SuccessURL2.
  robokassa: {
    merchantLogin: process.env.ROBOKASSA_MERCHANT_LOGIN || '',
    password2: process.env.ROBOKASSA_PASSWORD_2 || '',
  },

  smtp: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '25', 10),
    secure: (process.env.SMTP_SECURE ?? 'false') === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'Kids CEO <noreply@kids-ceo.ru>',
  },

  englishLessons: {
    materialsUrl:
      process.env.ENGLISH_LESSONS_MATERIALS_URL ||
      'https://drive.google.com/drive/folders/1_guTloxL7jrMS-Oxl_ftQg4we-ShEAQS?usp=sharing',
  },

  adminNotifyEmail: process.env.ADMIN_NOTIFY_EMAIL || '',
};
