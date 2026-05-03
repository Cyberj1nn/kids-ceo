import { useEffect, useState } from 'react';
import type { CalendarEvent, CalendarEventInput } from '../api/calendar';
import './EventEditor.css';

interface Props {
  initial: CalendarEvent | null; // null = create mode
  onCancel: () => void;
  onSave: (input: CalendarEventInput) => Promise<void>;
}

// Конвертация ISO → значение для <input type="datetime-local">
// (требует формат YYYY-MM-DDTHH:MM в локальном времени)
function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(local: string): string {
  // datetime-local trnsфера в локальном времени → конвертим в ISO с учётом TZ браузера
  return new Date(local).toISOString();
}

export default function EventEditor({ initial, onCancel, onSave }: Props) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [link, setLink] = useState(initial?.link || '');
  const [startLocal, setStartLocal] = useState(
    initial ? isoToLocalInput(initial.startAt) : isoToLocalInput(new Date(Date.now() + 3600_000).toISOString())
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onCancel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Введите название');
      return;
    }
    if (!startLocal) {
      setError('Выберите дату и время');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        link: link.trim() || null,
        startAt: localInputToIso(startLocal),
      });
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Не удалось сохранить событие');
      setSaving(false);
    }
  };

  return (
    <div className="event-editor-overlay" onClick={onCancel}>
      <form
        className="event-editor"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <button
          type="button"
          className="event-editor-close"
          onClick={onCancel}
          aria-label="Закрыть"
        >
          ✕
        </button>

        <h2 className="event-editor-title">
          {initial ? 'Редактировать событие' : 'Новое событие'}
        </h2>

        <label className="event-editor-field">
          <span>Название *</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder="Например: Эфир по продажам"
            autoFocus
          />
        </label>

        <label className="event-editor-field">
          <span>Дата и время *</span>
          <input
            type="datetime-local"
            value={startLocal}
            onChange={(e) => setStartLocal(e.target.value)}
          />
        </label>

        <label className="event-editor-field">
          <span>Описание</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Что будет на мероприятии?"
          />
        </label>

        <label className="event-editor-field">
          <span>Ссылка (если есть)</span>
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
          />
          <small>Если указать — клик по событию ведёт по этой ссылке</small>
        </label>

        {error && <div className="event-editor-error">{error}</div>}

        <div className="event-editor-actions">
          <button type="button" className="event-editor-cancel" onClick={onCancel} disabled={saving}>
            Отмена
          </button>
          <button type="submit" className="event-editor-save" disabled={saving}>
            {saving ? 'Сохранение...' : initial ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </form>
    </div>
  );
}
