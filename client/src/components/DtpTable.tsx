import { useState, useCallback, useRef } from 'react';
import { saveDtpEntry, updateDtpEntry, type DtpEntry } from '../api/dtp';
import './DtpTable.css';

interface DtpTableProps {
  year: number;
  month: number;
  week: number;
  entries: DtpEntry[];
  dates: { dayIndex: number; date: string; label: string }[];
  onUpdated: () => void;
  readOnly?: boolean;
  onAudit?: (entryId: string) => void;
}

const FIELD_LABELS: Record<string, string> = {
  achievements: 'Достижения',
  difficulties: 'Трудности',
  suggestions: 'Предложения',
};

const FIELD_KEYS = ['achievements', 'difficulties', 'suggestions'] as const;

export default function DtpTable({ year, month, week, entries, dates, onUpdated, readOnly, onAudit }: DtpTableProps) {
  const [saving, setSaving] = useState<string | null>(null);
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const getEntry = useCallback(
    (dayIndex: number) => entries.find((e) => e.dayIndex === dayIndex),
    [entries]
  );

  const getValue = (dayIndex: number, field: typeof FIELD_KEYS[number]): string => {
    const entry = getEntry(dayIndex);
    return entry ? entry[field] : '';
  };

  const handleChange = (dayIndex: number, field: typeof FIELD_KEYS[number], value: string) => {
    const key = `${dayIndex}-${field}`;

    // Debounce: сохранить через 800мс после последнего ввода
    if (debounceRef.current[key]) clearTimeout(debounceRef.current[key]);

    debounceRef.current[key] = setTimeout(async () => {
      await saveField(dayIndex, field, value);
    }, 800);
  };

  const handleBlur = (dayIndex: number, field: typeof FIELD_KEYS[number], value: string) => {
    const key = `${dayIndex}-${field}`;
    if (debounceRef.current[key]) {
      clearTimeout(debounceRef.current[key]);
      delete debounceRef.current[key];
    }
    saveField(dayIndex, field, value);
  };

  const saveField = async (dayIndex: number, field: typeof FIELD_KEYS[number], value: string) => {
    const entry = getEntry(dayIndex);
    const dateInfo = dates.find((d) => d.dayIndex === dayIndex);
    if (!dateInfo) return;

    setSaving(`${dayIndex}-${field}`);
    try {
      if (entry) {
        await updateDtpEntry(entry.id, { [field]: value });
      } else {
        await saveDtpEntry({
          year, month, week, dayIndex,
          entryDate: dateInfo.date,
          achievements: field === 'achievements' ? value : '',
          difficulties: field === 'difficulties' ? value : '',
          suggestions: field === 'suggestions' ? value : '',
        });
      }
      onUpdated();
    } catch (err) {
      console.error('DTP save error:', err);
    } finally {
      setSaving(null);
    }
  };

  // Desktop: таблица
  return (
    <>
      <div className="dtp-table-desktop">
        <table className="dtp-table">
          <thead>
            <tr>
              <th className="dtp-table-header-label"></th>
              {dates.map((d) => (
                <th key={d.dayIndex} className="dtp-table-header-date">{d.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FIELD_KEYS.map((field) => (
              <tr key={field} className={`dtp-table-row dtp-table-row--${field}`}>
                <td className="dtp-table-label">
                  {FIELD_LABELS[field]}
                </td>
                {dates.map((d) => {
                  const entry = getEntry(d.dayIndex);
                  const cellKey = `${d.dayIndex}-${field}`;
                  return (
                    <td key={d.dayIndex} className="dtp-table-cell">
                      <textarea
                        className="dtp-table-input"
                        defaultValue={getValue(d.dayIndex, field)}
                        onChange={(e) => handleChange(d.dayIndex, field, e.target.value)}
                        onBlur={(e) => handleBlur(d.dayIndex, field, e.target.value)}
                        readOnly={readOnly}
                        placeholder="..."
                      />
                      {saving === cellKey && <span className="dtp-table-saving">●</span>}
                      {onAudit && entry && (
                        <button
                          className="dtp-table-audit-btn"
                          onClick={() => onAudit(entry.id)}
                          title="История изменений"
                        >
                          🕐
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: карточный вид */}
      <div className="dtp-table-mobile">
        {dates.map((d) => (
          <div key={d.dayIndex} className="dtp-card">
            <div className="dtp-card-date">{d.label}</div>
            {FIELD_KEYS.map((field) => {
              const entry = getEntry(d.dayIndex);
              const cellKey = `${d.dayIndex}-${field}`;
              return (
                <div key={field} className={`dtp-card-field dtp-card-field--${field}`}>
                  <label>{FIELD_LABELS[field]}</label>
                  <textarea
                    defaultValue={getValue(d.dayIndex, field)}
                    onChange={(e) => handleChange(d.dayIndex, field, e.target.value)}
                    onBlur={(e) => handleBlur(d.dayIndex, field, e.target.value)}
                    readOnly={readOnly}
                    placeholder="..."
                  />
                  {saving === cellKey && <span className="dtp-table-saving">●</span>}
                  {onAudit && entry && (
                    <button
                      className="dtp-table-audit-btn"
                      onClick={() => onAudit(entry.id)}
                      title="История"
                    >
                      🕐
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}
