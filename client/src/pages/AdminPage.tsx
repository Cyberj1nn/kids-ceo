import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getUsers, createUser, updateUser, resetPassword, deactivateUser,
  getUserTabs, setUserTabs,
  type UserItem, type TabAccess,
} from '../api/admin';
import './AdminPage.css';

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Суперадмин',
  admin: 'Админ',
  mentor: 'Наставник',
  user: 'Пользователь',
};

export default function AdminPage() {
  const { user } = useAuth();
  const isSuperadmin = user?.role === 'superadmin';

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'users' | 'access'>('users');

  // User form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset password
  const [generatedPassword, setGeneratedPassword] = useState<{ userId: string; password: string } | null>(null);

  // Tab access
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [tabAccess, setTabAccess] = useState<TabAccess[]>([]);

  const loadUsers = useCallback(() => {
    setLoading(true);
    getUsers().then(setUsers).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // ========== User Form ==========
  const openCreate = () => {
    setEditingUser(null);
    setFirstName('');
    setLastName('');
    setLogin('');
    setPassword('');
    setRole('user');
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (u: UserItem) => {
    setEditingUser(u);
    setFirstName(u.firstName);
    setLastName(u.lastName);
    setLogin(u.login);
    setPassword('');
    setRole(u.role);
    setFormError('');
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);

    try {
      if (editingUser) {
        await updateUser(editingUser.id, { firstName, lastName, login, role });
      } else {
        if (!password) { setFormError('Пароль обязателен'); setSaving(false); return; }
        await createUser({ firstName, lastName, login, password, role });
      }
      setFormOpen(false);
      loadUsers();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!confirm('Сбросить пароль? Старый пароль будет недействителен.')) return;
    try {
      const { newPassword } = await resetPassword(userId);
      setGeneratedPassword({ userId, password: newPassword });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка');
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (!confirm('Деактивировать пользователя? Он потеряет доступ к платформе.')) return;
    try {
      await deactivateUser(userId);
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка');
    }
  };

  // ========== Tab Access ==========
  const loadTabAccess = async (userId: string) => {
    setSelectedUserId(userId);
    try {
      const tabs = await getUserTabs(userId);
      setTabAccess(tabs);
    } catch { setTabAccess([]); }
  };

  const toggleTab = async (tabId: number, currentState: boolean) => {
    if (!selectedUserId) return;
    const newTabs = currentState
      ? tabAccess.filter((t) => t.id !== tabId).filter((t) => t.hasAccess).map((t) => t.id)
      : [...tabAccess.filter((t) => t.hasAccess).map((t) => t.id), tabId];

    try {
      await setUserTabs(selectedUserId, newTabs);
      setTabAccess((prev) =>
        prev.map((t) => t.id === tabId ? { ...t, hasAccess: !currentState } : t)
      );
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка');
    }
  };

  const setAllTabs = async (open: boolean) => {
    if (!selectedUserId) return;
    const newTabIds = open ? tabAccess.map((t) => t.id) : [];
    try {
      await setUserTabs(selectedUserId, newTabIds);
      setTabAccess((prev) => prev.map((t) => ({ ...t, hasAccess: open })));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Админка</h1>
        <div className="admin-tabs">
          <button
            className={`admin-tab ${view === 'users' ? 'admin-tab--active' : ''}`}
            onClick={() => setView('users')}
          >
            Пользователи
          </button>
          <button
            className={`admin-tab ${view === 'access' ? 'admin-tab--active' : ''}`}
            onClick={() => setView('access')}
          >
            Доступ к вкладкам
          </button>
        </div>
      </div>

      {/* ========== USERS TAB ========== */}
      {view === 'users' && (
        <>
          <div className="admin-toolbar">
            <button className="admin-create-btn" onClick={openCreate}>+ Создать пользователя</button>
          </div>

          {/* Generated password alert */}
          {generatedPassword && (
            <div className="admin-alert">
              <strong>Новый пароль:</strong> <code>{generatedPassword.password}</code>
              <button onClick={() => setGeneratedPassword(null)}>✕</button>
            </div>
          )}

          {/* User form modal */}
          {formOpen && (
            <div className="admin-modal-overlay" onClick={() => setFormOpen(false)}>
              <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                <h2>{editingUser ? 'Редактировать' : 'Создать пользователя'}</h2>
                <form onSubmit={handleSubmit} className="admin-form">
                  {formError && <div className="admin-form-error">{formError}</div>}
                  <div className="admin-form-row">
                    <div className="admin-form-field">
                      <label>Имя</label>
                      <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                    </div>
                    <div className="admin-form-field">
                      <label>Фамилия</label>
                      <input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                    </div>
                  </div>
                  <div className="admin-form-field">
                    <label>Логин</label>
                    <input value={login} onChange={(e) => setLogin(e.target.value)} required />
                  </div>
                  {!editingUser && (
                    <div className="admin-form-field">
                      <label>Пароль</label>
                      <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                  )}
                  <div className="admin-form-field">
                    <label>Роль</label>
                    <select value={role} onChange={(e) => setRole(e.target.value)}>
                      <option value="user">Пользователь</option>
                      {isSuperadmin && <option value="admin">Админ</option>}
                      {isSuperadmin && <option value="mentor">Наставник</option>}
                    </select>
                  </div>
                  <div className="admin-form-actions">
                    <button type="button" className="admin-btn-secondary" onClick={() => setFormOpen(false)}>Отмена</button>
                    <button type="submit" className="admin-btn-primary" disabled={saving}>
                      {saving ? 'Сохранение...' : editingUser ? 'Сохранить' : 'Создать'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* User table */}
          {loading ? (
            <div className="admin-loading">Загрузка...</div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Имя</th>
                    <th>Фамилия</th>
                    <th>Логин</th>
                    <th>Роль</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.firstName}</td>
                      <td>{u.lastName}</td>
                      <td><code>{u.login}</code></td>
                      <td><span className={`admin-role-badge admin-role-badge--${u.role}`}>{ROLE_LABELS[u.role]}</span></td>
                      <td className="admin-actions-cell">
                        <button className="admin-action" onClick={() => openEdit(u)} title="Редактировать">✎</button>
                        <button className="admin-action" onClick={() => handleResetPassword(u.id)} title="Сбросить пароль">🔑</button>
                        {u.id !== user?.id && (
                          <button className="admin-action admin-action--danger" onClick={() => handleDeactivate(u.id)} title="Деактивировать">✕</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ========== ACCESS TAB ========== */}
      {view === 'access' && (
        <div className="admin-access">
          <div className="admin-access-top">
            <select
              className="admin-access-select"
              value={selectedUserId || ''}
              onChange={(e) => e.target.value && loadTabAccess(e.target.value)}
            >
              <option value="">Выберите пользователя</option>
              {users.filter((u) => u.role === 'user').map((u) => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.login})</option>
              ))}
            </select>

            {selectedUserId && (
              <div className="admin-access-bulk">
                <button className="admin-btn-small" onClick={() => setAllTabs(true)}>Открыть все</button>
                <button className="admin-btn-small" onClick={() => setAllTabs(false)}>Закрыть все</button>
              </div>
            )}
          </div>

          {selectedUserId && tabAccess.length > 0 && (
            <div className="admin-access-grid">
              {tabAccess.map((tab) => (
                <label key={tab.id} className="admin-access-item">
                  <input
                    type="checkbox"
                    checked={tab.hasAccess}
                    onChange={() => toggleTab(tab.id, tab.hasAccess)}
                  />
                  <span>{tab.name}</span>
                </label>
              ))}
            </div>
          )}

          {!selectedUserId && (
            <div className="admin-loading">Выберите пользователя для настройки доступа</div>
          )}
        </div>
      )}
    </div>
  );
}
