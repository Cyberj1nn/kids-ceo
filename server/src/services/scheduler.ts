import { query } from '../db/pool';
import { pushNotificationToUser } from '../socket';

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
  setTimeout(() => {
    tick();
    setInterval(tick, TICK_MS);
  }, 5_000);
}
