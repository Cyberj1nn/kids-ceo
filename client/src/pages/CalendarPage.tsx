import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  type CalendarEvent,
  type CalendarEventInput,
} from '../api/calendar';
import EventModal from '../components/EventModal';
import EventEditor from '../components/EventEditor';
import './CalendarPage.css';

const ADMIN_ROLES = ['admin', 'mentor', 'superadmin'];

function formatDateHeader(d: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(d, today)) return 'Сегодня';
  if (sameDay(d, tomorrow)) return 'Завтра';

  const weekday = d.toLocaleDateString('ru-RU', { weekday: 'long' });
  const date = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  return `${weekday[0].toUpperCase() + weekday.slice(1)}, ${date}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CalendarPage() {
  const { user } = useAuth();
  const isAdmin = !!user && ADMIN_ROLES.includes(user.role);

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CalendarEvent | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEvents();
      setEvents(data);
    } catch {
      setError('Не удалось загрузить события');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const now = Date.now();
    const upcoming: Record<string, CalendarEvent[]> = {};
    const past: Record<string, CalendarEvent[]> = {};

    for (const ev of events) {
      const isPast = new Date(ev.startAt).getTime() < now;
      const target = isPast ? past : upcoming;
      const key = dayKey(ev.startAt);
      if (!target[key]) target[key] = [];
      target[key].push(ev);
    }

    const sortKeysAsc = (a: string, b: string) => a.localeCompare(b);
    const sortKeysDesc = (a: string, b: string) => b.localeCompare(a);

    return {
      upcoming: Object.keys(upcoming).sort(sortKeysAsc).map((k) => ({ key: k, events: upcoming[k] })),
      past: Object.keys(past).sort(sortKeysDesc).map((k) => ({ key: k, events: past[k] })),
    };
  }, [events]);

  const handleCardClick = (ev: CalendarEvent) => {
    setSelected(ev);
  };

  const handleSave = async (input: CalendarEventInput) => {
    if (editTarget) {
      const updated = await updateEvent(editTarget.id, input);
      setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    } else {
      const created = await createEvent(input);
      setEvents((prev) => [...prev, created].sort((a, b) => a.startAt.localeCompare(b.startAt)));
    }
    setEditorOpen(false);
    setEditTarget(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить событие?')) return;
    await deleteEvent(id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setSelected(null);
  };

  const renderCard = (ev: CalendarEvent, isPast: boolean) => (
    <button
      key={ev.id}
      type="button"
      className={`calendar-card ${isPast ? 'calendar-card--past' : ''}`}
      onClick={() => handleCardClick(ev)}
    >
      <div className="calendar-card-time">{formatTime(ev.startAt)}</div>
      <div className="calendar-card-body">
        <div className="calendar-card-title">{ev.title}</div>
        {ev.description && <div className="calendar-card-desc">{ev.description}</div>}
        {ev.link && <div className="calendar-card-link">🔗 Есть ссылка</div>}
      </div>
    </button>
  );

  return (
    <div className="calendar-page">
      <div className="calendar-page-header">
        <h1>Календарь</h1>
        {isAdmin && (
          <button
            className="calendar-add-btn"
            onClick={() => {
              setEditTarget(null);
              setEditorOpen(true);
            }}
          >
            + Добавить событие
          </button>
        )}
      </div>

      {loading && <div className="calendar-status">Загрузка...</div>}
      {error && <div className="calendar-status calendar-status--error">{error}</div>}

      {!loading && !error && events.length === 0 && (
        <div className="calendar-empty">
          {isAdmin
            ? 'Событий пока нет. Нажмите «Добавить событие», чтобы создать первое.'
            : 'Событий пока нет.'}
        </div>
      )}

      {!loading && grouped.upcoming.length > 0 && (
        <section className="calendar-section">
          <h2 className="calendar-section-title">Предстоящие</h2>
          {grouped.upcoming.map(({ key, events }) => (
            <div key={key} className="calendar-day-group">
              <div className="calendar-day-header">{formatDateHeader(new Date(key))}</div>
              <div className="calendar-cards">
                {events.map((ev) => renderCard(ev, false))}
              </div>
            </div>
          ))}
        </section>
      )}

      {!loading && grouped.past.length > 0 && (
        <section className="calendar-section calendar-section--past">
          <h2 className="calendar-section-title">Прошедшие</h2>
          {grouped.past.map(({ key, events }) => (
            <div key={key} className="calendar-day-group">
              <div className="calendar-day-header">{formatDateHeader(new Date(key))}</div>
              <div className="calendar-cards">
                {events.map((ev) => renderCard(ev, true))}
              </div>
            </div>
          ))}
        </section>
      )}

      {selected && (
        <EventModal
          event={selected}
          isAdmin={isAdmin}
          onClose={() => setSelected(null)}
          onEdit={() => {
            setEditTarget(selected);
            setEditorOpen(true);
            setSelected(null);
          }}
          onDelete={() => handleDelete(selected.id)}
        />
      )}

      {editorOpen && (
        <EventEditor
          initial={editTarget}
          onCancel={() => {
            setEditorOpen(false);
            setEditTarget(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
