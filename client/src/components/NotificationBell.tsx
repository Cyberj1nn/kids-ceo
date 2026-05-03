import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import {
  getNotifications,
  getNotificationsCount,
  markNotificationRead,
  markAllNotificationsRead,
  type AppNotification,
} from '../api/notifications';
import './NotificationBell.css';

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diffSec = (Date.now() - d.getTime()) / 1000;

  if (diffSec < 60) return 'только что';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} мин назад`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} ч назад`;
  if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)} дн назад`;
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function iconForKind(kind: AppNotification['kind']): string {
  switch (kind) {
    case 'event_1h':
      return '🕐';
    case 'event_5min':
      return '⏰';
    case 'personal_message':
      return '✉️';
    default:
      return '🔔';
  }
}

function setBadge(count: number): void {
  const nav = navigator as Navigator & {
    setAppBadge?: (n?: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
  };
  try {
    if (count > 0 && typeof nav.setAppBadge === 'function') {
      nav.setAppBadge(count).catch(() => {});
    } else if (typeof nav.clearAppBadge === 'function') {
      nav.clearAppBadge().catch(() => {});
    }
  } catch {
    // Badging API не поддерживается — игнорируем
  }
}

export default function NotificationBell() {
  const socket = useSocket();
  const navigate = useNavigate();

  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Начальная загрузка счётчика
  useEffect(() => {
    getNotificationsCount()
      .then((c) => {
        setCount(c.total);
        setBadge(c.total);
      })
      .catch(() => {});
  }, []);

  // Сброс при прочтении сообщений в открытом чате
  useEffect(() => {
    const handleRead = () =>
      getNotificationsCount()
        .then((c) => {
          setCount(c.total);
          setBadge(c.total);
        })
        .catch(() => {});
    window.addEventListener('chat:read', handleRead);
    return () => window.removeEventListener('chat:read', handleRead);
  }, []);

  // WebSocket: общий счётчик
  useEffect(() => {
    if (!socket) return;

    const handleUnread = (data: { total?: number; unreadCount?: number }) => {
      const next = typeof data.total === 'number' ? data.total : data.unreadCount || 0;
      setCount(next);
      setBadge(next);
    };

    const handleNewNotification = (n: AppNotification) => {
      // если дропдаун открыт — добавим сверху
      setItems((prev) => {
        if (prev.some((p) => p.id === n.id)) return prev;
        return [n, ...prev];
      });
    };

    socket.on('notification:unread', handleUnread);
    socket.on('notification:new', handleNewNotification);
    return () => {
      socket.off('notification:unread', handleUnread);
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket]);

  // Закрытие по клику вне
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const toggleOpen = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    setLoadingItems(true);
    try {
      const data = await getNotifications(20);
      setItems(data);
    } catch {
      // silent
    } finally {
      setLoadingItems(false);
    }
  };

  const handleItemClick = async (n: AppNotification) => {
    if (!n.readAt) {
      try {
        await markNotificationRead(n.id);
      } catch {
        // silent
      }
      setItems((prev) => prev.map((p) => (p.id === n.id ? { ...p, readAt: new Date().toISOString() } : p)));
      const next = Math.max(0, count - 1);
      setCount(next);
      setBadge(next);
    }
    setOpen(false);
    if (n.link) {
      if (/^https?:\/\//i.test(n.link)) {
        window.open(n.link, '_blank', 'noopener,noreferrer');
      } else {
        navigate(n.link);
      }
    }
  };

  const handleReadAll = async () => {
    try {
      await markAllNotificationsRead();
    } catch {
      // silent
    }
    setItems((prev) => prev.map((p) => (p.readAt ? p : { ...p, readAt: new Date().toISOString() })));
    // счётчик личных сообщений может остаться, обновим из сервера
    try {
      const c = await getNotificationsCount();
      setCount(c.total);
      setBadge(c.total);
    } catch {
      // silent
    }
  };

  return (
    <div className="notification-bell-wrap" ref={dropdownRef}>
      <button
        className="notification-bell"
        onClick={toggleOpen}
        title="Уведомления"
        aria-label="Уведомления"
      >
        <span className="notification-bell-icon">🔔</span>
        {count > 0 && (
          <span className="notification-bell-badge">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown" role="menu">
          <div className="notification-dropdown-header">
            <span>Уведомления</span>
            <button
              type="button"
              className="notification-readall"
              onClick={handleReadAll}
              disabled={items.every((i) => !!i.readAt)}
            >
              Прочитать всё
            </button>
          </div>

          <div className="notification-dropdown-list">
            {loadingItems && <div className="notification-dropdown-empty">Загрузка...</div>}
            {!loadingItems && items.length === 0 && (
              <div className="notification-dropdown-empty">Нет уведомлений</div>
            )}
            {!loadingItems &&
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={`notification-item ${!n.readAt ? 'notification-item--unread' : ''}`}
                  onClick={() => handleItemClick(n)}
                >
                  <span className="notification-item-icon">{iconForKind(n.kind)}</span>
                  <span className="notification-item-body">
                    <span className="notification-item-title">{n.title}</span>
                    {n.body && <span className="notification-item-text">{n.body}</span>}
                    <span className="notification-item-time">{formatRelative(n.createdAt)}</span>
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
