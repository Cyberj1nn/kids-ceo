import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { createServer } from 'http';
import { config } from './config';
import { pool } from './db/pool';
import authRouter from './routes/auth';
import tabsRouter from './routes/tabs';
import contentRouter from './routes/content';
import uploadRouter from './routes/upload';
import chatRouter from './routes/chat';
import dtpRouter from './routes/dtp';
import usersRouter from './routes/users';
import callTrackerRouter from './routes/callTracker';
import paymentsRouter from './routes/payments';
import calendarRouter from './routes/calendar';
import notificationsRouter from './routes/notifications';
import groupsRouter from './routes/groups';
import pushRouter from './routes/push';
import { initSocket } from './socket';
import { startScheduler } from './services/scheduler';
import { initWebPush } from './services/webPush';

const app = express();
const httpServer = createServer(app);

// --- Socket.io ---
initSocket(httpServer);

// --- Middleware ---

// Helmet с разрешением Rutube iframe
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      frameSrc: ["'self'", "https://rutube.ru"],
      connectSrc: ["'self'", "wss:", "ws:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: config.clientUrl,
  credentials: true,
}));

// Доверять proxy (Nginx) для корректного IP в rate limiter
if (config.nodeEnv === 'production') {
  app.set('trust proxy', 1);
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: config.nodeEnv === 'production' ? 300 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много запросов, попробуйте позже' },
});
app.use('/api/', limiter);

// Строгий rate limiter для auth (защита от брутфорса)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Слишком много попыток входа, попробуйте позже' },
});
app.use('/api/auth/login', authLimiter);

// Статика для загруженных файлов
// __dirname в prod = dist/, поэтому .. поднимаемся на уровень server/uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// --- Роуты ---

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/tabs', tabsRouter);
app.use('/api', contentRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/chat', chatRouter);
app.use('/api/notifications', notificationsRouter);
// Старый эндпоинт /api/notifications/unread-count остался в chatRouter ради обратной совместимости.
// Новые роуты (list, count, read, read-all) обрабатываются notificationsRouter выше — у него есть GET '/'
// и GET '/count', а /unread-count из chatRouter не пересекается с ними.
app.use('/api/notifications', chatRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/push', pushRouter);
app.use('/api/dtp', dtpRouter);
app.use('/api/users', usersRouter);
app.use('/api/call-tracker', callTrackerRouter);
app.use('/api/payments', paymentsRouter);

// --- Обработка ошибок ---

app.use((_req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// --- Запуск ---

httpServer.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  initWebPush();
  startScheduler();
});

export { app, httpServer };
