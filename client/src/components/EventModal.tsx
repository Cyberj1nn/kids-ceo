import { useEffect } from 'react';
import type { CalendarEvent } from '../api/calendar';
import './EventModal.css';

interface Props {
  event: CalendarEvent;
  isAdmin: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EventModal({ event, isAdmin, onClose, onEdit, onDelete }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleOpenLink = () => {
    if (event.link) {
      window.open(event.link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="event-modal-overlay" onClick={onClose}>
      <div className="event-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="event-modal-close" onClick={onClose} aria-label="Закрыть">✕</button>

        <div className="event-modal-date">{formatFullDate(event.startAt)}</div>
        <h2 className="event-modal-title">{event.title}</h2>

        {event.description && (
          <div className="event-modal-description">{event.description}</div>
        )}

        {event.link && (
          <div className="event-modal-actions">
            <button className="event-modal-link-btn" onClick={handleOpenLink}>
              Перейти по ссылке
            </button>
          </div>
        )}

        {isAdmin && (
          <div className="event-modal-admin-actions">
            <button className="event-modal-edit-btn" onClick={onEdit}>Редактировать</button>
            <button className="event-modal-delete-btn" onClick={onDelete}>Удалить</button>
          </div>
        )}
      </div>
    </div>
  );
}
