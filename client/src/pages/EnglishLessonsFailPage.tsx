import { Link, useSearchParams } from 'react-router-dom';
import './EnglishLessonsPage.css';

const REASON_MESSAGES: Record<string, string> = {
  bad_signature: 'Не удалось подтвердить платёж. Если деньги списались — напишите нам, мы разберёмся.',
  missing_params: 'Платёж не завершён: не пришли необходимые параметры.',
  bad_inv_id: 'Платёж не завершён: некорректный идентификатор операции.',
  db_error: 'Техническая ошибка при сохранении платежа. Если деньги списались — напишите нам.',
};

export default function EnglishLessonsFailPage() {
  const [params] = useSearchParams();
  const reason = params.get('reason');
  const detail = reason && REASON_MESSAGES[reason];

  return (
    <div className="evp">
      <div className="evp-status">
        <div className="evp-status__card evp-status__card--fail">
          <span className="evp-status__icon evp-status__icon--fail">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </span>
          <h1 className="evp-status__title">Платёж не прошёл</h1>
          <p className="evp-status__text">
            {detail || 'Оплата была отменена или произошла ошибка. Вы можете попробовать ещё раз.'}
          </p>
          <div className="evp-status__actions">
            <Link to="/english_lessons" className="evp-btn evp-btn--blue evp-btn--lg">
              Попробовать снова
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
