import { query } from '../db/pool';
import { pushNotificationToUser } from '../socket';

const TICK_MS = 60_000; // раз в минуту

/**
 * Форматирует дату и время в читаемом виде (МСК).
 */
function formatTime(d: Date): string {
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow',
  });
}

interface PendingEvent {
  id: string;
  title: string;
  link: string | null;
  start_at: string;
}

/**
 * Найти события, для которых пора отправить уведомление "за 1 час".
 * Окно: start_at между NOW + 59min и NOW + 61min.
 * После отправки помечаем notified_1h_at = NOW().
 */
async function processOneHourReminders(): Promise<void> {
  const { rows: events } = await query(
    `SELECT id, title, link, start_at
     FROM calendar_events
     WHERE deleted_at IS NULL
       AND notified_1h_at IS NULL
       AND start_at >= NOW() + interval '59 minutes'
       AND start_at <= NOW() + interval '61 minutes'`
  );

  if (events.length === 0) return;

  const { rows: users } = await query(
    `SELECT id FROM users WHERE deleted_at IS NULL`
  );

  for (const ev of events as PendingEvent[]) {
    const startDate = new Date(ev.start_at);
    const body = `Через час начнётся: ${formatTime(startDate)} (МСК)`;
    const link = ev.link || '/calendar';

    for (const u of users) {
      const { rows } = await query(
        `INSERT INTO notifications (user_id, kind, title, body, link, payload)
         VALUES ($1, 'event_1h', $2, $3, $4, $5)
         RETURNING id, kind, title, body, link, payload,
                   read_at AS "readAt",
                   created_at AS "createdAt"`,
        [u.id, ev.title, body, link, JSON.stringify({ eventId: ev.id })]
      );
      pushNotificationToUser(u.id, rows[0]);
    }

    await query(
      `UPDATE calendar_events SET notified_1h_at = NOW() WHERE id = $1`,
      [ev.id]
    );
  }
}

/**
 * Найти события, для которых пора отправить уведомление "за 5 минут".
 * Окно: start_at между NOW + 4min и NOW + 6min.
 */
async function processFiveMinuteReminders(): Promise<void> {
  const { rows: events } = await query(
    `SELECT id, title, link, start_at
     FROM calendar_events
     WHERE deleted_at IS NULL
       AND notified_5min_at IS NULL
       AND start_at >= NOW() + interval '4 minutes'
       AND start_at <= NOW() + interval '6 minutes'`
  );

  if (events.length === 0) return;

  const { rows: users } = await query(
    `SELECT id FROM users WHERE deleted_at IS NULL`
  );

  for (const ev of events as PendingEvent[]) {
    const body = `Через 5 минут начнётся: ${ev.title}`;
    const link = ev.link || '/calendar';

    for (const u of users) {
      const { rows } = await query(
        `INSERT INTO notifications (user_id, kind, title, body, link, payload)
         VALUES ($1, 'event_5min', $2, $3, $4, $5)
         RETURNING id, kind, title, body, link, payload,
                   read_at AS "readAt",
                   created_at AS "createdAt"`,
        [u.id, ev.title, body, link, JSON.stringify({ eventId: ev.id })]
      );
      pushNotificationToUser(u.id, rows[0]);
    }

    await query(
      `UPDATE calendar_events SET notified_5min_at = NOW() WHERE id = $1`,
      [ev.id]
    );
  }
}

async function tick(): Promise<void> {
  try {
    await processOneHourReminders();
    await processFiveMinuteReminders();
  } catch (err) {
    console.error('Scheduler tick error:', err);
  }
}

export function startScheduler(): void {
  console.log(`Calendar scheduler started (tick interval: ${TICK_MS / 1000}s)`);
  // Первый запуск через 5 секунд после старта (чтобы DB точно подключилась)
  setTimeout(() => {
    tick();
    setInterval(tick, TICK_MS);
  }, 5_000);
}
