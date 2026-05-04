import { query } from '../db/pool';
import { pushNotificationToUser } from '../socket';
import { sendPushToUser } from './webPush';

const TICK_MS = 60_000; // раз в минуту

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
  audience_type: 'all' | 'users' | 'groups';
}

/**
 * Возвращает список user_id, кому видно это событие — учитывая audience.
 * Только активные (не удалённые) пользователи и группы.
 */
async function getEventTargetUsers(ev: PendingEvent): Promise<string[]> {
  if (ev.audience_type === 'all') {
    const { rows } = await query(
      `SELECT id FROM users WHERE deleted_at IS NULL`
    );
    return rows.map((r: any) => r.id);
  }

  if (ev.audience_type === 'users') {
    const { rows } = await query(
      `SELECT u.id
       FROM calendar_event_users cu
       JOIN users u ON u.id = cu.user_id AND u.deleted_at IS NULL
       WHERE cu.event_id = $1`,
      [ev.id]
    );
    return rows.map((r: any) => r.id);
  }

  // groups
  const { rows } = await query(
    `SELECT DISTINCT u.id
     FROM calendar_event_groups cg
     JOIN user_groups g ON g.id = cg.group_id AND g.deleted_at IS NULL
     JOIN user_group_members m ON m.group_id = g.id
     JOIN users u ON u.id = m.user_id AND u.deleted_at IS NULL
     WHERE cg.event_id = $1`,
    [ev.id]
  );
  return rows.map((r: any) => r.id);
}

async function processOneHourReminders(): Promise<void> {
  const { rows: events } = await query(
    `SELECT id, title, link, start_at, audience_type
     FROM calendar_events
     WHERE deleted_at IS NULL
       AND notified_1h_at IS NULL
       AND start_at >= NOW() + interval '59 minutes'
       AND start_at <= NOW() + interval '61 minutes'`
  );

  if (events.length === 0) return;

  for (const ev of events as PendingEvent[]) {
    const startDate = new Date(ev.start_at);
    const body = `Через час начнётся: ${formatTime(startDate)} (МСК)`;
    const link = ev.link || '/calendar';

    const targets = await getEventTargetUsers(ev);

    for (const userId of targets) {
      const { rows } = await query(
        `INSERT INTO notifications (user_id, kind, title, body, link, payload)
         VALUES ($1, 'event_1h', $2, $3, $4, $5)
         RETURNING id, kind, title, body, link, payload,
                   read_at AS "readAt",
                   created_at AS "createdAt"`,
        [userId, ev.title, body, link, JSON.stringify({ eventId: ev.id })]
      );
      pushNotificationToUser(userId, rows[0]);
      void sendPushToUser(userId, {
        title: ev.title,
        body,
        link,
        tag: `event-1h-${ev.id}`,
      });
    }

    await query(
      `UPDATE calendar_events SET notified_1h_at = NOW() WHERE id = $1`,
      [ev.id]
    );
  }
}

async function processFiveMinuteReminders(): Promise<void> {
  const { rows: events } = await query(
    `SELECT id, title, link, start_at, audience_type
     FROM calendar_events
     WHERE deleted_at IS NULL
       AND notified_5min_at IS NULL
       AND start_at >= NOW() + interval '4 minutes'
       AND start_at <= NOW() + interval '6 minutes'`
  );

  if (events.length === 0) return;

  for (const ev of events as PendingEvent[]) {
    const body = `Через 5 минут начнётся: ${ev.title}`;
    const link = ev.link || '/calendar';

    const targets = await getEventTargetUsers(ev);

    for (const userId of targets) {
      const { rows } = await query(
        `INSERT INTO notifications (user_id, kind, title, body, link, payload)
         VALUES ($1, 'event_5min', $2, $3, $4, $5)
         RETURNING id, kind, title, body, link, payload,
                   read_at AS "readAt",
                   created_at AS "createdAt"`,
        [userId, ev.title, body, link, JSON.stringify({ eventId: ev.id })]
      );
      pushNotificationToUser(userId, rows[0]);
      void sendPushToUser(userId, {
        title: ev.title,
        body,
        link,
        tag: `event-5min-${ev.id}`,
      });
    }

    await query(
      `UPDATE calendar_events SET notified_5min_at = NOW() WHERE id = $1`,
      [ev.id]
    );
  }
}

// Текущий час по МСК — для окна срабатывания ДТП-напоминания
function getMoscowHour(): number {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Moscow',
      hour: 'numeric',
      hour12: false,
    });
    const parts = fmt.formatToParts(new Date());
    const hourPart = parts.find((p) => p.type === 'hour');
    if (!hourPart) return -1;
    return parseInt(hourPart.value, 10) % 24;
  } catch {
    return -1;
  }
}

async function processDtpDailyReminders(): Promise<void> {
  // Окно срабатывания: 20:00–22:59 МСК (узкое — чтобы не дёргать каждую минуту весь день;
  // широкое — чтобы переживать рестарты сервера). Идемпотентность через notifications.
  const hour = getMoscowHour();
  if (hour < 20 || hour > 22) return;

  // Кому нужно напомнить:
  //   role='user', не удалён,
  //   нет dtp_entry за сегодня (МСК) c хоть одним непустым полем,
  //   за сегодня (МСК) ещё не отправляли dtp_reminder.
  const { rows } = await query(
    `WITH today AS (
       SELECT (NOW() AT TIME ZONE 'Europe/Moscow')::date AS d
     )
     SELECT u.id
     FROM users u, today
     WHERE u.role = 'user'
       AND u.deleted_at IS NULL
       AND NOT EXISTS (
         SELECT 1 FROM dtp_entries de
         WHERE de.user_id = u.id
           AND de.entry_date = today.d
           AND (
             COALESCE(NULLIF(TRIM(de.achievements), ''), NULL) IS NOT NULL
             OR COALESCE(NULLIF(TRIM(de.difficulties), ''), NULL) IS NOT NULL
             OR COALESCE(NULLIF(TRIM(de.suggestions), ''), NULL) IS NOT NULL
           )
       )
       AND NOT EXISTS (
         SELECT 1 FROM notifications n, today
         WHERE n.user_id = u.id
           AND n.kind = 'dtp_reminder'
           AND (n.created_at AT TIME ZONE 'Europe/Moscow')::date = today.d
       )`
  );

  if (rows.length === 0) return;

  for (const row of rows) {
    const userId = row.id as string;
    const { rows: notifRows } = await query(
      `INSERT INTO notifications (user_id, kind, title, body, link, payload)
       VALUES ($1, 'dtp_reminder', $2, $3, $4, $5)
       RETURNING id, kind, title, body, link, payload,
                 read_at AS "readAt",
                 created_at AS "createdAt"`,
      [
        userId,
        'Не забудь заполнить ДТП',
        'Запиши достижения, трудности и предложения за сегодня',
        '/dtp',
        JSON.stringify({}),
      ]
    );
    pushNotificationToUser(userId, notifRows[0]);
    void sendPushToUser(userId, {
      title: 'Не забудь заполнить ДТП',
      body: 'Запиши достижения, трудности и предложения за сегодня',
      link: '/dtp',
      tag: `dtp-${userId}-${new Date().toISOString().slice(0, 10)}`,
    });
  }
}

async function tick(): Promise<void> {
  try {
    await processOneHourReminders();
    await processFiveMinuteReminders();
    await processDtpDailyReminders();
  } catch (err) {
    console.error('Scheduler tick error:', err);
  }
}

export function startScheduler(): void {
  console.log(`Calendar scheduler started (tick interval: ${TICK_MS / 1000}s)`);
  setTimeout(() => {
    tick();
    setInterval(tick, TICK_MS);
  }, 5_000);
}
