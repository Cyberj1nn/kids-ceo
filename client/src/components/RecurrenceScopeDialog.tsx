import { useEffect } from 'react';
import type { EditScope } from '../api/calendar';
import './RecurrenceScopeDialog.css';

interface Props {
  action: 'edit' | 'delete';
  onChoose: (scope: EditScope) => void;
  onCancel: () => void;
}

export default function RecurrenceScopeDialog({ action, onChoose, onCancel }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const verb = action === 'delete' ? 'Удалить' : 'Изменить';
  const title = action === 'delete' ? 'Удалить повторяющееся событие' : 'Изменить повторяющееся событие';

  return (
    <div className="recurrence-scope-overlay" onClick={onCancel}>
      <div className="recurrence-scope-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3 className="recurrence-scope-title">{title}</h3>
        <p className="recurrence-scope-text">Это событие — часть серии. Что нужно сделать?</p>

        <button
          type="button"
          className="recurrence-scope-option"
          onClick={() => onChoose('this')}
        >
          {verb} только это событие
        </button>

        <button
          type="button"
          className={`recurrence-scope-option ${action === 'delete' ? 'recurrence-scope-option--danger' : ''}`}
          onClick={() => onChoose('following')}
        >
          {verb} это и все последующие
        </button>

        <button type="button" className="recurrence-scope-cancel" onClick={onCancel}>
          Отмена
        </button>
      </div>
    </div>
  );
}
