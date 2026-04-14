import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { getUnreadCount } from '../api/chat';
import './NotificationBell.css';

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const socket = useSocket();
  const navigate = useNavigate();

  // Загрузить начальное количество
  useEffect(() => {
    getUnreadCount().then(setCount).catch(() => {});
  }, []);

  // Сбрасывать счётчик когда чат прочитан
  useEffect(() => {
    const handleRead = () => getUnreadCount().then(setCount).catch(() => {});
    window.addEventListener('chat:read', handleRead);
    return () => window.removeEventListener('chat:read', handleRead);
  }, []);

  // Обновлять через WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleUnread = (data: { unreadCount: number }) => {
      setCount(data.unreadCount);
    };

    socket.on('notification:unread', handleUnread);
    return () => { socket.off('notification:unread', handleUnread); };
  }, [socket]);

  return (
    <button
      className="notification-bell"
      onClick={() => navigate('/personal-chat')}
      title="Личные сообщения"
    >
      <span className="notification-bell-icon">🔔</span>
      {count > 0 && (
        <span className="notification-bell-badge">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
