import { useEffect, useState } from 'react';
import type { CalendarEvent } from '../api/calendar';
import { getGroups, type UserGroup } from '../api/groups';
import { getUsers, type UserItem } from '../api/admin';
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
  const [audienceLabel, setAudienceLabel] = useState<string | null>(null);

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

  // Подгружаем имена групп/пользователей для отображения у админа
  useEffect(() => {
    if (!isAdmin) return;

    const aType = event.audienceType;
    if (aType === 'all') {
      setAudienceLabel('Все пользователи');
      return;
    }

    if (aType === 'users') {
      const ids = event.audienceUserIds || [];
      if (ids.length === 0) {
        setAudienceLabel('Никто (пусто)');
        return;
      }
      getUsers()
        .then((users: UserItem[]) => {
          const names = users
            .filter((u) => ids.includes(u.id))
            .map((u) => `${u.firstName} ${u.lastName}`);
          setAudienceLabel(names.length > 0 ? names.join(', ') : `${ids.length} пользователь(ей)`);
        })
        .catch(() => setAudienceLabel(`${ids.length} пользователь(ей)`));
      return;
    }

    if (aType === 'groups') {
      const ids = event.audienceGroupIds || [];
      if (ids.length === 0) {
        setAudienceLabel('Никто (пусто)');
        return;
      }
      getGroups()
        .then((groups: UserGroup[]) => {
          const names = groups
            .filter((g) => ids.includes(g.id))
            .map((g) => g.name);
          setAudienceLabel(names.length > 0 ? `Группы: ${names.join(', ')}` : `${ids.length} групп(ы)`);
        })
        .catch(() => setAudienceLabel(`${ids.length} групп(ы)`));
    }
  }, [isAdmin, event.audienceType, event.audienceUserIds, event.audienceGroupIds]);

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

        {isAdmin && audienceLabel && (
          <div className="event-modal-audience">
            <span className="event-modal-audience-label">Видно:</span>
            <span className="event-modal-audience-value">{audienceLabel}</span>
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
