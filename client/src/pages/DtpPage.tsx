import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDtpEntries, type DtpEntry } from '../api/dtp';
import DtpTable from '../components/DtpTable';
import api from '../api/axios';
import './DtpPage.css';

interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

function getWeekDates(year: number, month: number, week: number) {
  // Первый день месяца
  const firstDay = new Date(year, month - 1, 1);
  // Понедельник первой недели месяца
  const dayOfWeek = firstDay.getDay(); // 0=Sun, 1=Mon, ...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const firstMonday = new Date(year, month - 1, 1 + mondayOffset);

  const weekStart = new Date(firstMonday);
  weekStart.setDate(weekStart.getDate() + (week - 1) * 7);

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    dates.push({
      dayIndex: i + 1,
      date: d.toISOString().split('T')[0],
      label: `${dayNames[i]} ${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}`,
    });
  }
  return dates;
}

export default function DtpPage() {
  const { user } = useAuth();
  const isAdmin = ['superadmin', 'admin', 'mentor'].includes(user?.role || '');

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [week, setWeek] = useState(1);
  const [entries, setEntries] = useState<DtpEntry[]>([]);
  const [selectedUserId, setSelectedUserId] = useState(user?.id || '');
  const [users, setUsers] = useState<UserOption[]>([]);
  const [auditEntryId, setAuditEntryId] = useState<string | null>(null);
  const [auditData, setAuditData] = useState<any[]>([]);

  const dates = getWeekDates(year, month, week);

  // Загрузить список пользователей (только role=user) для админов
  useEffect(() => {
    if (!isAdmin) return;
    api.get('/users').then(({ data }) => {
      setUsers((data as UserOption[]).filter((u) => u.role === 'user'));
    }).catch(() => {});
  }, [isAdmin]);

  // Загрузить записи ДТП
  const loadEntries = useCallback(() => {
    const uid = selectedUserId || user?.id || '';
    if (!uid) return;
    getDtpEntries(uid, year, month)
      .then(setEntries)
      .catch(console.error);
  }, [selectedUserId, user?.id, year, month]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Фильтрация записей по неделе
  const weekEntries = entries.filter((e) => e.week === week);

  // Audit modal
  const openAudit = async (entryId: string) => {
    try {
      const { data } = await api.get(`/dtp/${entryId}/audit`);
      setAuditData(data);
      setAuditEntryId(entryId);
    } catch {
      alert('Ошибка загрузки истории');
    }
  };

  const FIELD_LABELS: Record<string, string> = {
    achievements: 'Достижения',
    difficulties: 'Трудности',
    suggestions: 'Предложения',
  };

  const selectedUser = users.find((u) => u.id === selectedUserId);
  const viewingOther = isAdmin && selectedUserId !== user?.id;

  return (
    <div className="dtp-page">
      <div className="dtp-page-header">
        <h1 className="dtp-page-title">
          ДТП
          {viewingOther && selectedUser && (
            <span className="dtp-page-title-user">
              — {selectedUser.firstName} {selectedUser.lastName}
            </span>
          )}
        </h1>
      </div>

      {isAdmin && (
        <div className="dtp-user-tabs">
          <button
            className={`dtp-user-tab ${selectedUserId === user?.id ? 'dtp-user-tab--active' : ''}`}
            onClick={() => setSelectedUserId(user?.id || '')}
          >
            Мои записи
          </button>
          {users.map((u) => (
            <button
              key={u.id}
              className={`dtp-user-tab ${selectedUserId === u.id ? 'dtp-user-tab--active' : ''}`}
              onClick={() => setSelectedUserId(u.id)}
            >
              {u.firstName} {u.lastName}
            </button>
          ))}
        </div>
      )}

      {/* Селектор месяца */}
      <div className="dtp-month-selector">
        <button className="dtp-month-nav" onClick={() => {
          if (month === 1) { setMonth(12); setYear(year - 1); }
          else setMonth(month - 1);
        }}>←</button>

        <div className="dtp-month-chips">
          {MONTH_NAMES.map((name, i) => (
            <button
              key={i}
              className={`dtp-month-chip ${month === i + 1 ? 'dtp-month-chip--active' : ''}`}
              onClick={() => setMonth(i + 1)}
            >
              {name}
            </button>
          ))}
        </div>

        <button className="dtp-month-nav" onClick={() => {
          if (month === 12) { setMonth(1); setYear(year + 1); }
          else setMonth(month + 1);
        }}>→</button>

        <span className="dtp-year">{year}</span>
      </div>

      {/* Табы недель */}
      <div className="dtp-week-tabs">
        {[1, 2, 3, 4, 5].map((w) => (
          <button
            key={w}
            className={`dtp-week-tab ${week === w ? 'dtp-week-tab--active' : ''}`}
            onClick={() => setWeek(w)}
          >
            Неделя {w}
          </button>
        ))}
      </div>

      {/* Таблица */}
      <DtpTable
        year={year}
        month={month}
        week={week}
        entries={weekEntries}
        dates={dates}
        onUpdated={loadEntries}
        readOnly={viewingOther}
        onAudit={isAdmin ? openAudit : undefined}
      />

      {/* Audit modal */}
      {auditEntryId && (
        <div className="dtp-audit-overlay" onClick={() => setAuditEntryId(null)}>
          <div className="dtp-audit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dtp-audit-header">
              <h3>История изменений</h3>
              <button onClick={() => setAuditEntryId(null)}>✕</button>
            </div>
            {auditData.length === 0 ? (
              <p className="dtp-audit-empty">Нет изменений</p>
            ) : (
              <div className="dtp-audit-list">
                {auditData.map((a: any) => (
                  <div key={a.id} className="dtp-audit-item">
                    <div className="dtp-audit-meta">
                      <span className="dtp-audit-field">{FIELD_LABELS[a.fieldChanged] || a.fieldChanged}</span>
                      <span className="dtp-audit-by">{a.changedBy}</span>
                      <span className="dtp-audit-time">
                        {new Date(a.changedAt).toLocaleString('ru-RU')}
                      </span>
                    </div>
                    <div className="dtp-audit-diff">
                      {a.oldValue && <span className="dtp-audit-old">{a.oldValue}</span>}
                      <span className="dtp-audit-arrow">→</span>
                      <span className="dtp-audit-new">{a.newValue}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
