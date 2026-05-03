import { useEffect, useState } from 'react';
import './PwaInstallButton.css';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISS_KEY = 'pwa-install-dismissed-at';
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 дней

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  // iOS Safari
  if ((navigator as any).standalone === true) return true;
  return false;
}

function isIOSSafari(): boolean {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  // Safari на iOS — единственный браузер, поддерживающий "Добавить на экран Домой"
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return isIOS && isSafari;
}

function isDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    return Date.now() - parseInt(raw, 10) < DISMISS_TTL_MS;
  } catch {
    return false;
  }
}

export default function PwaInstallButton() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setHidden(true);
      return;
    }
    if (isDismissedRecently()) {
      setHidden(true);
      return;
    }

    // Android/Chrome/Edge — встроенный prompt
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt as EventListener);

    // Когда установили — скрываем
    const onInstalled = () => {
      setHidden(true);
      setInstallEvent(null);
    };
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt as EventListener);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (hidden) return null;

  const handleClick = async () => {
    if (installEvent) {
      try {
        await installEvent.prompt();
        const choice = await installEvent.userChoice;
        if (choice.outcome === 'accepted') {
          setHidden(true);
        }
      } catch {
        // silent
      }
      setInstallEvent(null);
    } else if (isIOSSafari()) {
      setShowIosHint(true);
    }
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // silent
    }
    setHidden(true);
  };

  // Показываем кнопку только если есть событие prompt или это iOS Safari
  if (!installEvent && !isIOSSafari()) return null;

  return (
    <>
      <button
        type="button"
        className="pwa-install-btn"
        onClick={handleClick}
        title="Установить приложение"
        aria-label="Установить приложение"
      >
        <svg
          className="pwa-install-btn-icon"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 3v12" />
          <path d="m6 9 6 6 6-6" />
          <path d="M5 21h14" />
        </svg>
        <span className="pwa-install-btn-label">Установить</span>
      </button>

      {showIosHint && (
        <div className="pwa-ios-hint-overlay" onClick={() => setShowIosHint(false)}>
          <div className="pwa-ios-hint" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="pwa-ios-hint-close"
              onClick={() => setShowIosHint(false)}
              aria-label="Закрыть"
            >
              ✕
            </button>
            <h3>Установка на iPhone</h3>
            <ol>
              <li>Нажмите кнопку <strong>«Поделиться»</strong> в нижней панели Safari (квадрат со стрелкой ↑)</li>
              <li>Прокрутите меню и выберите <strong>«На экран „Домой"»</strong></li>
              <li>Нажмите <strong>«Добавить»</strong> в правом верхнем углу</li>
            </ol>
            <p className="pwa-ios-hint-note">
              После установки приложение будет работать как обычное — с иконкой на главном экране.
            </p>
            <button type="button" className="pwa-ios-hint-dismiss" onClick={handleDismiss}>
              Больше не показывать
            </button>
          </div>
        </div>
      )}
    </>
  );
}
