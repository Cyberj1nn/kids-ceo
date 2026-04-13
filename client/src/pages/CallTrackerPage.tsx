import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getCallTrackerEntries,
  createCallTrackerEntry,
  updateCallTrackerEntry,
  deleteCallTrackerEntry,
  type CallTrackerEntry,
} from '../api/callTracker';
import api from '../api/axios';
import './CallTrackerPage.css';

interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
}

export default function CallTrackerPage() {
  const { user } = useAuth();
  const isAdmin = ['superadmin', 'admin', 'mentor'].includes(user?.role || '');

  const [entries, setEntries] = useState<CallTrackerEntry[]>([]);
  const [selectedUserId, setSelectedUserId] = useState(user?.id || '');
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSummary, setEditSummary] = useState('');
  const [editDate, setEditDate] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    api.get('/users').then(({ data }) => setUsers(data)).catch(() => {});
  }, [isAdmin]);

  const loadEntries = useCallback(() => {
    const uid = selectedUserId || user?.id || '';
    if (!uid) return;
    setLoading(true);
    getCallTrackerEntries(uid)
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedUserId, user?.id]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleAdd = async () => {
    if (!newDate) return;
    try {
      await createCallTrackerEntry(selectedUserId, newDate, newSummary);
      setAdding(false);
      setNewDate('');
      setNewSummary('');
      loadEntries();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка создания');
    }
  };

  const handleStartEdit = (entry: CallTrackerEntry) => {
    setEditingId(entry.id);
    setEditDate(entry.callDate.split('T')[0]);
    setEditSummary(entry.summary);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      await updateCallTrackerEntry(editingId, { callDate: editDate, summary: editSummary });
      setEditingId(null);
      loadEntries();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка сохранения');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить запись?')) return;
    await deleteCallTrackerEntry(id);
    loadEntries();
  };

  return (
    <div className="ct-page">
      <div className="ct-header">
        <h1 className="ct-title">Трекер созвонов</h1>
        <div className="ct-header-actions">
          {isAdmin && users.length > 0 && (
            <select
              className="ct-user-select"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value={user?.id}>Мои записи</option>
              {users.filter((u) => u.id !== user?.id).map((u) => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
              ))}
            </select>
          )}
          {isAdmin && (
            <button className="ct-add-btn" onClick={() => setAdding(true)}>
              + Добавить
            </button>
          )}
        </div>
      </div>

      {/* Форма добавления */}
      {adding && (
        <div className="ct-add-form">
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="ct-date-input"
          />
          <textarea
            value={newSummary}
            onChange={(e) => setNewSummary(e.target.value)}
            placeholder="Краткая информация о созвоне..."
            className="ct-summary-input"
            rows={4}
          />
          <div className="ct-add-form-actions">
            <button className="ct-btn-secondary" onClick={() => { setAdding(false); setNewDate(''); setNewSummary(''); }}>
              Отмена
            </button>
            <button className="ct-btn-primary" onClick={handleAdd} disabled={!newDate}>
              Сохранить
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="ct-loading">Загрузка...</div>
      ) : entries.length === 0 ? (
        <div className="ct-empty">Нет записей о созвонах</div>
      ) : (
        <div className="ct-table-wrap">
          <table className="ct-table">
            <thead>
              <tr>
                <th className="ct-col-num">№</th>
                <th className="ct-col-date">Дата</th>
                <th className="ct-col-summary">Краткая информация</th>
                {isAdmin && <th className="ct-col-actions"></th>}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => (
                <tr key={entry.id} className="ct-row">
                  <td className="ct-cell-num">{String(idx + 1).padStart(2, '0')}</td>
                  <td className="ct-cell-date">
                    {editingId === entry.id ? (
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="ct-date-input ct-date-input--inline"
                      />
                    ) : (
                      new Date(entry.callDate).toLocaleDateString('ru-RU')
                    )}
                  </td>
                  <td className="ct-cell-summary">
                    {editingId === entry.id ? (
                      <textarea
                        value={editSummary}
                        onChange={(e) => setEditSummary(e.target.value)}
                        className="ct-summary-input ct-summary-input--inline"
                        rows={4}
                      />
                    ) : (
                      <div className="ct-summary-text">{entry.summary}</div>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="ct-cell-actions">
                      {editingId === entry.id ? (
                        <div className="ct-inline-actions">
                          <button className="ct-action-save" onClick={handleSaveEdit}>✓</button>
                          <button className="ct-action-cancel" onClick={() => setEditingId(null)}>✕</button>
                        </div>
                      ) : (
                        <div className="ct-inline-actions">
                          <button className="ct-action-edit" onClick={() => handleStartEdit(entry)} title="Редактировать">✎</button>
                          <button className="ct-action-delete" onClick={() => handleDelete(entry.id)} title="Удалить">🗑</button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
