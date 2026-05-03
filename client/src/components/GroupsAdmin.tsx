import { useEffect, useState, useCallback } from 'react';
import {
  getGroups,
  createGroup,
  renameGroup,
  deleteGroup,
  getGroupMembers,
  setGroupMembers,
  type UserGroup,
  type GroupMember,
} from '../api/groups';
import { getUsers, type UserItem } from '../api/admin';
import './GroupsAdmin.css';

export default function GroupsAdmin() {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Создание/переименование
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Управление участниками
  const [membersOpenFor, setMembersOpenFor] = useState<UserGroup | null>(null);
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());
  const [membersSaving, setMembersSaving] = useState(false);
  const [membersFilter, setMembersFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [g, u] = await Promise.all([getGroups(), getUsers()]);
      setGroups(g);
      setUsers(u);
    } catch {
      setError('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditingGroup(null);
    setFormName('');
    setFormError(null);
    setFormOpen(true);
  };

  const openRename = (g: UserGroup) => {
    setEditingGroup(g);
    setFormName(g.name);
    setFormError(null);
    setFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formName.trim()) {
      setFormError('Введите название группы');
      return;
    }
    setSaving(true);
    try {
      if (editingGroup) {
        const updated = await renameGroup(editingGroup.id, formName.trim());
        setGroups((prev) => prev.map((g) => (g.id === updated.id ? { ...g, ...updated } : g)));
      } else {
        const created = await createGroup(formName.trim());
        setGroups((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setFormOpen(false);
    } catch (err: any) {
      setFormError(err?.response?.data?.error || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (g: UserGroup) => {
    if (!confirm(`Удалить группу "${g.name}"? События, привязанные к ней, перестанут быть видны её участникам.`)) return;
    try {
      await deleteGroup(g.id);
      setGroups((prev) => prev.filter((x) => x.id !== g.id));
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Ошибка удаления');
    }
  };

  const openMembers = async (g: UserGroup) => {
    setMembersOpenFor(g);
    setMembersFilter('');
    try {
      const m: GroupMember[] = await getGroupMembers(g.id);
      setMemberIds(new Set(m.map((x) => x.id)));
    } catch {
      setMemberIds(new Set());
    }
  };

  const toggleMember = (userId: string) => {
    setMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const saveMembers = async () => {
    if (!membersOpenFor) return;
    setMembersSaving(true);
    try {
      await setGroupMembers(membersOpenFor.id, Array.from(memberIds));
      setGroups((prev) =>
        prev.map((g) => (g.id === membersOpenFor.id ? { ...g, memberCount: memberIds.size } : g))
      );
      setMembersOpenFor(null);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Ошибка сохранения');
    } finally {
      setMembersSaving(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!membersFilter.trim()) return true;
    const q = membersFilter.trim().toLowerCase();
    return (
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.login.toLowerCase().includes(q)
    );
  });

  return (
    <div className="groups-admin">
      <div className="groups-admin-toolbar">
        <button className="admin-create-btn" onClick={openCreate}>+ Создать группу</button>
      </div>

      {loading && <div className="admin-loading">Загрузка...</div>}
      {error && <div className="admin-form-error">{error}</div>}

      {!loading && !error && groups.length === 0 && (
        <div className="groups-admin-empty">
          Групп пока нет. Создайте первую, например "Клуб" или "Личка".
        </div>
      )}

      {!loading && groups.length > 0 && (
        <div className="groups-admin-list">
          {groups.map((g) => (
            <div key={g.id} className="groups-admin-card">
              <div className="groups-admin-card-info">
                <div className="groups-admin-card-name">{g.name}</div>
                <div className="groups-admin-card-meta">
                  {g.memberCount ?? 0} {pluralMembers(g.memberCount ?? 0)}
                </div>
              </div>
              <div className="groups-admin-card-actions">
                <button className="admin-btn-small" onClick={() => openMembers(g)}>Участники</button>
                <button className="admin-btn-small" onClick={() => openRename(g)}>Переименовать</button>
                <button
                  className="admin-btn-small admin-btn-small--danger"
                  onClick={() => handleDelete(g)}
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Форма создания/переименования */}
      {formOpen && (
        <div className="admin-modal-overlay" onClick={() => !saving && setFormOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingGroup ? 'Переименовать группу' : 'Новая группа'}</h2>
            <form onSubmit={handleFormSubmit} className="admin-form">
              {formError && <div className="admin-form-error">{formError}</div>}
              <div className="admin-form-field">
                <label>Название</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  maxLength={100}
                  autoFocus
                  required
                />
              </div>
              <div className="admin-form-actions">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setFormOpen(false)}
                  disabled={saving}
                >
                  Отмена
                </button>
                <button type="submit" className="admin-btn-primary" disabled={saving}>
                  {saving ? 'Сохранение...' : editingGroup ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Управление участниками */}
      {membersOpenFor && (
        <div className="admin-modal-overlay" onClick={() => !membersSaving && setMembersOpenFor(null)}>
          <div className="admin-modal groups-admin-members-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Участники: {membersOpenFor.name}</h2>

            <input
              className="groups-admin-search"
              type="search"
              placeholder="Поиск по имени или логину..."
              value={membersFilter}
              onChange={(e) => setMembersFilter(e.target.value)}
            />

            <div className="groups-admin-members-list">
              {filteredUsers.length === 0 && (
                <div className="groups-admin-empty">Никто не найден</div>
              )}
              {filteredUsers.map((u) => (
                <label key={u.id} className="groups-admin-member-item">
                  <input
                    type="checkbox"
                    checked={memberIds.has(u.id)}
                    onChange={() => toggleMember(u.id)}
                  />
                  <span className="groups-admin-member-name">
                    {u.lastName} {u.firstName}
                  </span>
                  <span className="groups-admin-member-login">{u.login}</span>
                </label>
              ))}
            </div>

            <div className="admin-form-actions">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => setMembersOpenFor(null)}
                disabled={membersSaving}
              >
                Отмена
              </button>
              <button
                type="button"
                className="admin-btn-primary"
                onClick={saveMembers}
                disabled={membersSaving}
              >
                {membersSaving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function pluralMembers(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'участников';
  if (mod10 === 1) return 'участник';
  if (mod10 >= 2 && mod10 <= 4) return 'участника';
  return 'участников';
}
