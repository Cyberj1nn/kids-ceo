import { useEffect, useState } from 'react';
import {
  getCurrentSubscription,
  isPushSupported,
  isIOSSafari,
  isStandalonePWA,
  requestPermissionAndSubscribe,
  unsubscribeUser,
} from '../lib/push';
import './PushToggle.css';

type State = 'unsupported' | 'ios-needs-install' | 'off' | 'on' | 'denied' | 'pending';

export default function PushToggle() {
  const [state, setState] = useState<State>('pending');
  const [showHint, setShowHint] = useState(false);

  const refresh = async () => {
    if (!isPushSupported()) {
      // На iOS Safari вне standalone push недоступен
      if (isIOSSafari() && !isStandalonePWA()) {
        setState('ios-needs-install');
      } else {
        setState('unsupported');
      }
      return;
    }
    if (isIOSSafari() && !isStandalonePWA()) {
      setState('ios-needs-install');
      return;
    }
    if (Notification.permission === 'denied') {
      setState('denied');
      return;
    }
    const sub = await getCurrentSubscription();
    setState(sub && Notification.permission === 'granted' ? 'on' : 'off');
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClick = async () => {
    if (state === 'unsupported') return;
    if (state === 'ios-needs-install') {
      setShowHint(true);
      return;
    }
    if (state === 'denied') {
      setShowHint(true);
      return;
    }

    if (state === 'on') {
      setState('pending');
      await unsubscribeUser();
      await refresh();
      return;
    }

    setState('pending');
    const result = await requestPermissionAndSubscribe();
    if (result === 'denied') {
      setState('denied');
      setShowHint(true);
      return;
    }
    await refresh();
  };

  if (state === 'unsupported') return null;

  const enabled = state === 'on';
  const title =
    state === 'ios-needs-install'
      ? 'Установите приложение, чтобы получать push'
      : state === 'denied'
        ? 'Push заблокированы в настройках браузера'
        : enabled
          ? 'Push-уведомления включены'
          : 'Включить push-уведомления';

  return (
    <>
      <button
        type="button"
        className={`push-toggle ${enabled ? 'push-toggle--on' : ''}`}
        onClick={handleClick}
        title={title}
        aria-label={title}
        aria-pressed={enabled}
        disabled={state === 'pending'}
      >
        <svg
          className="push-toggle-icon"
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          {!enabled && <line x1="3" y1="3" x2="21" y2="21" />}
        </svg>
      </button>

      {showHint && (
        <div className="push-hint-overlay" onClick={() => setShowHint(false)}>
          <div className="push-hint" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="push-hint-close"
              onClick={() => setShowHint(false)}
              aria-label="Закрыть"
            >
              ✕
            </button>
            {state === 'ios-needs-install' && (
              <>
                <h3>Push-уведомления на iPhone</h3>
                <p>
                  Чтобы получать уведомления на iPhone, нужно сначала установить
                  приложение на главный экран:
                </p>
                <ol>
                  <li>
                    Нажмите кнопку <strong>«Поделиться»</strong> в Safari
                    (квадрат со стрелкой ↑)
                  </li>
                  <li>
                    Выберите <strong>«На экран „Домой"»</strong>
                  </li>
                  <li>
                    Откройте приложение с домашнего экрана и снова включите
                    уведомления
                  </li>
                </ol>
              </>
            )}
            {state === 'denied' && (
              <>
                <h3>Уведомления заблокированы</h3>
                <p>
                  Браузер запретил отправку уведомлений. Чтобы включить —
                  откройте настройки сайта в адресной строке (значок замка)
                  и разрешите уведомления, затем обновите страницу.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
