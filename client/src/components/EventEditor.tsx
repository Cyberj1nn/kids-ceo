import { useEffect, useState } from 'react';
import type { CalendarEvent, CalendarEventInput, AudienceType } from '../api/calendar';
import { getGroups, type UserGroup } from '../api/groups';
import { getUsers, type UserItem } from '../api/admin';
import './EventEditor.css';

interface Props {
  initial: CalendarEvent | null;
  onCancel: () => void;
  onSave: (input: CalendarEventInput) => Promise<void>;
}

function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(local: string): string {
  return new Date(local).toISOString();
}

export default function EventEditor({ initial, onCancel, onSave }: Props) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [link, setLink] = useState(initial?.link || '');
  const [startLocal, setStartLocal] = useState(
    initial ? isoToLocalInput(initial.startAt) : isoToLocalInput(new Date(Date.now() + 3600_000).toISOString())
  );

  const [audienceType, setAudienceType] = useState<AudienceType>(initial?.audienceType || 'all');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    new Set(initial?.audienceUserIds || [])
  );
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(
    new Set(initial?.audienceGroupIds || [])
  );

  const [users, setUsers] = useState<UserItem[]>([]);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [usersFilter, setUsersFilter] = useState('');

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

  // Загружаем списки при первом открытии
  useEffect(() => {
    Promise.all([getUsers(), getGroups()])
      .then(([u, g]) => {
        setUsers(u);
        setGroups(g);
      })
      .catch(() => {});
  }, []);

  const toggleUser = (id: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGroup = (id: string) => {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
    if (audienceType === 'users' && selectedUserIds.size === 0) {
      setError('Выберите хотя бы одного пользователя');
      return;
    }
    if (audienceType === 'groups' && selectedGroupIds.size === 0) {
      setError('Выберите хотя бы одну группу');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        link: link.trim() || null,
        startAt: localInputToIso(startLocal),
        audienceType,
        audienceUserIds: audienceType === 'users' ? Array.from(selectedUserIds) : [],
        audienceGroupIds: audienceType === 'groups' ? Array.from(selectedGroupIds) : [],
      });
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Не удалось сохранить событие');
      setSaving(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!usersFilter.trim()) return true;
    const q = usersFilter.trim().toLowerCase();
    return (
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.login.toLowerCase().includes(q)
    );
  });

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
            rows={3}
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

        <div className="event-editor-field">
          <span>Кому видно *</span>
          <div className="event-editor-audience-tabs">
            <label className={`event-editor-audience-tab ${audienceType === 'all' ? 'event-editor-audience-tab--active' : ''}`}>
              <input
                type="radio"
                name="audience"
                value="all"
                checked={audienceType === 'all'}
                onChange={() => setAudienceType('all')}
              />
              <span>Все</span>
            </label>
            <label className={`event-editor-audience-tab ${audienceType === 'users' ? 'event-editor-audience-tab--active' : ''}`}>
              <input
                type="radio"
                name="audience"
                value="users"
                checked={audienceType === 'users'}
                onChange={() => setAudienceType('users')}
              />
              <span>Конкретные пользователи</span>
            </label>
            <label className={`event-editor-audience-tab ${audienceType === 'groups' ? 'event-editor-audience-tab--active' : ''}`}>
              <input
                type="radio"
                name="audience"
                value="groups"
                checked={audienceType === 'groups'}
                onChange={() => setAudienceType('groups')}
              />
              <span>По группам</span>
            </label>
          </div>

          {audienceType === 'users' && (
            <div className="event-editor-audience-pane">
              <input
                className="event-editor-audience-search"
                type="search"
                placeholder="Поиск по имени или логину..."
                value={usersFilter}
                onChange={(e) => setUsersFilter(e.target.value)}
              />
              <div className="event-editor-audience-list">
                {filteredUsers.length === 0 && (
                  <div className="event-editor-audience-empty">Никто не найден</div>
                )}
                {filteredUsers.map((u) => (
                  <label key={u.id} className="event-editor-audience-item">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.has(u.id)}
                      onChange={() => toggleUser(u.id)}
                    />
                    <span className="event-editor-audience-item-name">
                      {u.lastName} {u.firstName}
                    </span>
                    <span className="event-editor-audience-item-meta">{u.login}</span>
                  </label>
                ))}
              </div>
              <div className="event-editor-audience-counter">
                Выбрано: {selectedUserIds.size}
              </div>
            </div>
          )}

          {audienceType === 'groups' && (
            <div className="event-editor-audience-pane">
              {groups.length === 0 ? (
                <div className="event-editor-audience-empty">
                  Групп пока нет. Создайте их в админке (вкладка "Группы").
                </div>
              ) : (
                <div className="event-editor-audience-list">
                  {groups.map((g) => (
                    <label key={g.id} className="event-editor-audience-item">
                      <input
                        type="checkbox"
                        checked={selectedGroupIds.has(g.id)}
                        onChange={() => toggleGroup(g.id)}
                      />
                      <span className="event-editor-audience-item-name">{g.name}</span>
                      <span className="event-editor-audience-item-meta">
                        {g.memberCount ?? 0} чел.
                      </span>
                    </label>
                  ))}
                </div>
              )}
              <div className="event-editor-audience-counter">
                Выбрано групп: {selectedGroupIds.size}
              </div>
            </div>
          )}
        </div>

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
