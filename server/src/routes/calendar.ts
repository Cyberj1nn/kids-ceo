import { Router, Response } from 'express';
import { randomUUID } from 'crypto';
import { query } from '../db/pool';
import { authJWT } from '../middleware/auth';
import { roleCheck } from '../middleware/roleCheck';
import { AuthRequest } from '../types';

const router = Router();
const ADMIN_ROLES = roleCheck(['superadmin', 'admin', 'mentor']);

type AudienceType = 'all' | 'users' | 'groups';

interface AudienceInput {
  audienceType: AudienceType;
  audienceUserIds?: string[];
  audienceGroupIds?: string[];
}

interface RecurrenceInput {
  // День недели в формате JS Date.getDay(): 0=Sun, 1=Mon, ..., 6=Sat
  weekdays: number[];
  // ISO дата (YYYY-MM-DD), включительно
  until: string;
}

const MAX_RECURRING_EVENTS = 365; // защита от бесконечной генерации

function isAdminRole(role: string): boolean {
  return role === 'superadmin' || role === 'admin' || role === 'mentor';
}

async function fetchEventAudience(eventId: string): Promise<{
  userIds: string[];
  groupIds: string[];
}> {
  const [users, groups] = await Promise.all([
    query(`SELECT user_id FROM calendar_event_users WHERE event_id = $1`, [eventId]),
    query(`SELECT group_id FROM calendar_event_groups WHERE event_id = $1`, [eventId]),
  ]);
  return {
    userIds: users.rows.map((r: any) => r.user_id),
    groupIds: groups.rows.map((r: any) => r.group_id),
  };
}

async function setEventAudience(eventId: string, payload: AudienceInput): Promise<void> {
  // Сбрасываем существующее
  await query(`DELETE FROM calendar_event_users WHERE event_id = $1`, [eventId]);
  await query(`DELETE FROM calendar_event_groups WHERE event_id = $1`, [eventId]);

  if (payload.audienceType === 'users' && payload.audienceUserIds?.length) {
    for (const uid of payload.audienceUserIds) {
      await query(
        `INSERT INTO calendar_event_users (event_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [eventId, uid]
      );
    }
  } else if (payload.audienceType === 'groups' && payload.audienceGroupIds?.length) {
    for (const gid of payload.audienceGroupIds) {
      await query(
        `INSERT INTO calendar_event_groups (event_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [eventId, gid]
      );
    }
  }
}

function validateAudience(payload: AudienceInput): string | null {
  if (!['all', 'users', 'groups'].includes(payload.audienceType)) {
    return 'Некорректный тип аудитории';
  }
  if (payload.audienceType === 'users') {
    if (!Array.isArray(payload.audienceUserIds) || payload.audienceUserIds.length === 0) {
      return 'Выберите хотя бы одного пользователя';
    }
  }
  if (payload.audienceType === 'groups') {
    if (!Array.isArray(payload.audienceGroupIds) || payload.audienceGroupIds.length === 0) {
      return 'Выберите хотя бы одну группу';
    }
  }
  return null;
}

function validateRecurrence(rec: any): string | null {
  if (!rec || typeof rec !== 'object') return null;
  if (!Array.isArray(rec.weekdays) || rec.weekdays.length === 0) {
    return 'Выберите хотя бы один день недели';
  }
  for (const w of rec.weekdays) {
    if (typeof w !== 'number' || w < 0 || w > 6) {
      return 'Некорректный день недели (ожидается 0-6)';
    }
  }
  if (typeof rec.until !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(rec.until)) {
    return 'Некорректная дата окончания (YYYY-MM-DD)';
  }
  return null;
}

/**
 * Генерирует список start_at дат для серии: начиная со startAt,
 * берёт время из startAt и день каждой даты <= until,
 * у которой день недели входит в weekdays.
 */
function generateRecurrenceDates(startAt: Date, recurrence: RecurrenceInput): Date[] {
  const dates: Date[] = [];
  // until — конец дня в локали сервера; intent пользователя — включительно
  const untilDate = new Date(`${recurrence.until}T23:59:59`);

  const cursor = new Date(startAt.getTime());
  // Сбрасываем на начало даты startAt, время берём оригинальное
  while (cursor.getTime() <= untilDate.getTime() && dates.length < MAX_RECURRING_EVENTS) {
    if (recurrence.weekdays.includes(cursor.getDay())) {
      dates.push(new Date(cursor.getTime()));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

// GET /api/calendar/events?from=ISO&to=ISO
// Видимость:
//  - admin/mentor/superadmin → все события
//  - user → события с audience_type='all', либо где он указан напрямую,
//           либо где он в одной из активных групп события
router.get('/events', authJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;

    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    const conditions: string[] = ['e.deleted_at IS NULL'];
    const params: any[] = [];
    let idx = 1;

    if (from) {
      conditions.push(`e.start_at >= $${idx++}`);
      params.push(from);
    } else {
      conditions.push(`e.start_at >= NOW() - interval '30 days'`);
    }
    if (to) {
      conditions.push(`e.start_at <= $${idx++}`);
      params.push(to);
    }

    if (!isAdminRole(role)) {
      // Фильтр по audience для обычного пользователя
      const userParam = `$${idx++}`;
      params.push(userId);
      conditions.push(`(
        e.audience_type = 'all'
        OR (e.audience_type = 'users' AND EXISTS (
          SELECT 1 FROM calendar_event_users cu
          WHERE cu.event_id = e.id AND cu.user_id = ${userParam}
        ))
        OR (e.audience_type = 'groups' AND EXISTS (
          SELECT 1 FROM calendar_event_groups cg
          JOIN user_groups g ON g.id = cg.group_id AND g.deleted_at IS NULL
          JOIN user_group_members m ON m.group_id = g.id AND m.user_id = ${userParam}
          WHERE cg.event_id = e.id
        ))
      )`);
    }

    const { rows } = await query(
      `SELECT e.id, e.title, e.description, e.link,
              e.start_at AS "startAt",
              e.audience_type AS "audienceType",
              e.recurrence_id AS "recurrenceId",
              e.recurrence_pattern AS "recurrencePattern",
              e.created_by AS "createdBy",
              e.created_at AS "createdAt"
       FROM calendar_events e
       WHERE ${conditions.join(' AND ')}
       ORDER BY e.start_at ASC`,
      params
    );

    // Подтянем audience для админов (для отображения в редакторе)
    if (isAdminRole(role) && rows.length > 0) {
      const ids = rows.map((r: any) => r.id);
      const [usersRes, groupsRes] = await Promise.all([
        query(
          `SELECT event_id, user_id FROM calendar_event_users WHERE event_id = ANY($1::uuid[])`,
          [ids]
        ),
        query(
          `SELECT event_id, group_id FROM calendar_event_groups WHERE event_id = ANY($1::uuid[])`,
          [ids]
        ),
      ]);
      const usersByEvent: Record<string, string[]> = {};
      const groupsByEvent: Record<string, string[]> = {};
      for (const r of usersRes.rows as any[]) {
        (usersByEvent[r.event_id] ||= []).push(r.user_id);
      }
      for (const r of groupsRes.rows as any[]) {
        (groupsByEvent[r.event_id] ||= []).push(r.group_id);
      }
      for (const ev of rows as any[]) {
        ev.audienceUserIds = usersByEvent[ev.id] || [];
        ev.audienceGroupIds = groupsByEvent[ev.id] || [];
      }
    }

    res.json(rows);
  } catch (err) {
    console.error('Calendar list error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// POST /api/calendar/events
// body может содержать recurrence: { weekdays: [0..6], until: 'YYYY-MM-DD' }
router.post('/events', authJWT, ADMIN_ROLES, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, link, startAt, recurrence } = req.body;
    const userId = req.user!.userId;

    const audience: AudienceInput = {
      audienceType: req.body.audienceType || 'all',
      audienceUserIds: req.body.audienceUserIds,
      audienceGroupIds: req.body.audienceGroupIds,
    };

    if (!title || !title.trim()) {
      res.status(400).json({ error: 'Название обязательно' });
      return;
    }
    if (!startAt) {
      res.status(400).json({ error: 'Дата и время обязательны' });
      return;
    }

    const startDate = new Date(startAt);
    if (isNaN(startDate.getTime())) {
      res.status(400).json({ error: 'Некорректная дата' });
      return;
    }

    const audErr = validateAudience(audience);
    if (audErr) {
      res.status(400).json({ error: audErr });
      return;
    }

    const recErr = validateRecurrence(recurrence);
    if (recErr) {
      res.status(400).json({ error: recErr });
      return;
    }

    const cleanLink = (link || '').trim() || null;
    const cleanDesc = (description || '').trim() || null;

    // Если есть recurrence — генерируем массив дат, иначе одна дата
    let datesToCreate: Date[];
    let recurrenceId: string | null = null;
    let recurrencePatternJson: string | null = null;

    if (recurrence) {
      const generated = generateRecurrenceDates(startDate, recurrence as RecurrenceInput);
      if (generated.length === 0) {
        res.status(400).json({ error: 'Ни одна дата не подходит под расписание' });
        return;
      }
      datesToCreate = generated;
      recurrenceId = randomUUID();
      recurrencePatternJson = JSON.stringify({
        weekdays: (recurrence as RecurrenceInput).weekdays,
        until: (recurrence as RecurrenceInput).until,
      });
    } else {
      datesToCreate = [startDate];
    }

    await query('BEGIN');
    try {
      const created: any[] = [];
      for (const d of datesToCreate) {
        const { rows } = await query(
          `INSERT INTO calendar_events
             (title, description, link, start_at, created_by, audience_type, recurrence_id, recurrence_pattern)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id, title, description, link,
                     start_at AS "startAt",
                     audience_type AS "audienceType",
                     recurrence_id AS "recurrenceId",
                     recurrence_pattern AS "recurrencePattern",
                     created_by AS "createdBy",
                     created_at AS "createdAt"`,
          [
            title.trim(),
            cleanDesc,
            cleanLink,
            d.toISOString(),
            userId,
            audience.audienceType,
            recurrenceId,
            recurrencePatternJson,
          ]
        );

        await setEventAudience(rows[0].id, audience);
        created.push(rows[0]);
      }

      await query('COMMIT');

      // Возвращаем созданные события с audience-полями
      const result = await Promise.all(
        created.map(async (ev) => {
          const aud = await fetchEventAudience(ev.id);
          return { ...ev, audienceUserIds: aud.userIds, audienceGroupIds: aud.groupIds };
        })
      );

      // Если серия — отдаём массив, иначе одно событие (для обратной совместимости)
      if (recurrenceId) {
        res.status(201).json({ events: result, recurrenceId });
      } else {
        res.status(201).json(result[0]);
      }
    } catch (err) {
      await query('ROLLBACK');
      throw err;
    }
  } catch (err) {
    console.error('Calendar create error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// PUT /api/calendar/events/:id?scope=this|following
// scope=this (default) — только это событие
// scope=following     — это событие и все последующие в серии (по start_at)
router.put('/events/:id', authJWT, ADMIN_ROLES, async (req: AuthRequest, res: Response) => {
  try {
    const eventId = req.params.id as string;
    const scope = (req.query.scope as string) === 'following' ? 'following' : 'this';
    const { title, description, link, startAt } = req.body;
    const audienceProvided = req.body.audienceType !== undefined;

    // Подтягиваем оригинал, чтобы знать recurrence_id и start_at
    const { rows: origRows } = await query(
      `SELECT id, start_at, recurrence_id
         FROM calendar_events
        WHERE id = $1 AND deleted_at IS NULL`,
      [eventId]
    );
    if (origRows.length === 0) {
      res.status(404).json({ error: 'Событие не найдено' });
      return;
    }
    const orig = origRows[0];

    // Определяем целевые id
    let targetIds: string[];
    if (scope === 'following' && orig.recurrence_id) {
      const { rows: seriesRows } = await query(
        `SELECT id FROM calendar_events
          WHERE recurrence_id = $1
            AND start_at >= $2
            AND deleted_at IS NULL
          ORDER BY start_at`,
        [orig.recurrence_id, orig.start_at]
      );
      targetIds = seriesRows.map((r: any) => r.id);
    } else {
      targetIds = [eventId];
    }

    // Если меняем дату/время и scope=following — сдвигаем все события на ту же дельту,
    // чтобы сохранить расписание серии (например, перенос с 9:00 на 10:00 для всех будущих).
    let newStartDate: Date | null = null;
    let deltaMs = 0;
    if (startAt !== undefined) {
      const d = new Date(startAt);
      if (isNaN(d.getTime())) {
        res.status(400).json({ error: 'Некорректная дата' });
        return;
      }
      newStartDate = d;
      const origStart = new Date(orig.start_at);
      deltaMs = d.getTime() - origStart.getTime();
    }

    const baseFields: string[] = [];
    const baseValues: any[] = [];
    let pIdx = 1;

    if (title !== undefined) {
      if (!title.trim()) {
        res.status(400).json({ error: 'Название не может быть пустым' });
        return;
      }
      baseFields.push(`title = $${pIdx++}`);
      baseValues.push(title.trim());
    }
    if (description !== undefined) {
      baseFields.push(`description = $${pIdx++}`);
      baseValues.push((description || '').trim() || null);
    }
    if (link !== undefined) {
      baseFields.push(`link = $${pIdx++}`);
      baseValues.push((link || '').trim() || null);
    }

    if (audienceProvided) {
      const audience: AudienceInput = {
        audienceType: req.body.audienceType,
        audienceUserIds: req.body.audienceUserIds,
        audienceGroupIds: req.body.audienceGroupIds,
      };
      const audErr = validateAudience(audience);
      if (audErr) {
        res.status(400).json({ error: audErr });
        return;
      }
      baseFields.push(`audience_type = $${pIdx++}`);
      baseValues.push(audience.audienceType);
    }

    if (baseFields.length === 0 && newStartDate === null) {
      res.status(400).json({ error: 'Нет полей для обновления' });
      return;
    }

    await query('BEGIN');
    try {
      for (const tid of targetIds) {
        const fields = [...baseFields];
        const values = [...baseValues];
        let idx = pIdx;

        if (newStartDate) {
          if (tid === eventId) {
            // Текущее: ставим выбранную дату как есть
            fields.push(`start_at = $${idx++}`);
            values.push(newStartDate.toISOString());
          } else if (scope === 'following') {
            // Сдвигаем относительно старой start_at этого события на ту же дельту
            const { rows: tRows } = await query(
              `SELECT start_at FROM calendar_events WHERE id = $1`,
              [tid]
            );
            const shifted = new Date(new Date(tRows[0].start_at).getTime() + deltaMs);
            fields.push(`start_at = $${idx++}`);
            values.push(shifted.toISOString());
          }
          // Сбрасываем флаги нотификации, т.к. время поменялось
          fields.push(`notified_1h_at = NULL`);
          fields.push(`notified_5min_at = NULL`);
        }

        if (fields.length === 0) continue;

        values.push(tid);
        await query(
          `UPDATE calendar_events SET ${fields.join(', ')}
            WHERE id = $${idx} AND deleted_at IS NULL`,
          values
        );

        if (audienceProvided) {
          await setEventAudience(tid, {
            audienceType: req.body.audienceType,
            audienceUserIds: req.body.audienceUserIds,
            audienceGroupIds: req.body.audienceGroupIds,
          });
        }
      }
      await query('COMMIT');

      // Возвращаем обновлённое целевое событие
      const { rows: updated } = await query(
        `SELECT id, title, description, link,
                start_at AS "startAt",
                audience_type AS "audienceType",
                recurrence_id AS "recurrenceId",
                recurrence_pattern AS "recurrencePattern",
                created_by AS "createdBy",
                created_at AS "createdAt"
           FROM calendar_events WHERE id = $1`,
        [eventId]
      );
      const aud = await fetchEventAudience(eventId);
      res.json({
        ...updated[0],
        audienceUserIds: aud.userIds,
        audienceGroupIds: aud.groupIds,
        affectedCount: targetIds.length,
      });
    } catch (err) {
      await query('ROLLBACK');
      throw err;
    }
  } catch (err) {
    console.error('Calendar update error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// DELETE /api/calendar/events/:id?scope=this|following
router.delete('/events/:id', authJWT, ADMIN_ROLES, async (req: AuthRequest, res: Response) => {
  try {
    const eventId = req.params.id as string;
    const scope = (req.query.scope as string) === 'following' ? 'following' : 'this';

    const { rows: origRows } = await query(
      `SELECT id, start_at, recurrence_id
         FROM calendar_events
        WHERE id = $1 AND deleted_at IS NULL`,
      [eventId]
    );
    if (origRows.length === 0) {
      res.status(404).json({ error: 'Событие не найдено' });
      return;
    }
    const orig = origRows[0];

    let result;
    if (scope === 'following' && orig.recurrence_id) {
      result = await query(
        `UPDATE calendar_events SET deleted_at = NOW()
          WHERE recurrence_id = $1
            AND start_at >= $2
            AND deleted_at IS NULL
        RETURNING id`,
        [orig.recurrence_id, orig.start_at]
      );
    } else {
      result = await query(
        `UPDATE calendar_events SET deleted_at = NOW()
          WHERE id = $1 AND deleted_at IS NULL
        RETURNING id`,
        [eventId]
      );
    }

    res.json({ message: 'Событие удалено', affectedCount: result.rows.length });
  } catch (err) {
    console.error('Calendar delete error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

export default router;
