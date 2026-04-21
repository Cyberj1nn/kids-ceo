import { Link } from 'react-router-dom';
import './EnglishLessonsPage.css';

export default function EnglishLessonsSuccessPage() {
  return (
    <div className="evp">
      <div className="evp-status">
        <div className="evp-status__card">
          <span className="evp-status__icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <h1 className="evp-status__title">Оплата получена!</h1>
          <p className="evp-status__text">
            Спасибо! Письмо со&nbsp;ссылкой на&nbsp;материалы программы отправлено на&nbsp;почту,
            которую вы&nbsp;указали при оплате. Если не&nbsp;видите его в&nbsp;течение 5&nbsp;минут&nbsp;—
            проверьте папку «Спам».
          </p>
          <div className="evp-status__actions">
            <Link to="/english_lessons" className="evp-btn evp-btn--blue evp-btn--lg">
              Вернуться на лендинг
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
