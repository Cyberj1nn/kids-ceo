import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getChatRooms, type ChatRoom } from '../api/chat';
import ChatWindow from '../components/ChatWindow';
import './PersonalChatPage.css';

export default function PersonalChatPage() {
  const { user } = useAuth();
  const socket = useSocket();
  const isAdmin = ['superadmin', 'admin', 'mentor'].includes(user?.role || '');

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChatRooms()
      .then((all) => {
        const personal = all.filter((r) => r.type === 'personal');
        setRooms(personal);

        // Для обычного пользователя — сразу открыть единственную беседу
        if (!isAdmin && personal.length === 1) {
          setActiveRoom(personal[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAdmin]);

  // Обновлять unreadCount при получении notification:unread
  useEffect(() => {
    if (!socket) return;

    const handleUnread = () => {
      getChatRooms().then((all) => {
        setRooms(all.filter((r) => r.type === 'personal'));
      });
    };

    socket.on('notification:unread', handleUnread);
    return () => { socket.off('notification:unread', handleUnread); };
  }, [socket]);

  if (loading) {
    return <div className="personal-chat-loading">Загрузка...</div>;
  }

  // Пользователь без личных бесед
  if (rooms.length === 0) {
    return (
      <div className="personal-chat-empty">
        <p>У вас пока нет личных бесед</p>
      </div>
    );
  }

  // Пользователь с одной беседой — сразу чат
  if (!isAdmin && rooms.length === 1) {
    return <ChatWindow roomId={rooms[0].id} />;
  }

  // Админ/наставник: список + чат
  if (activeRoom) {
    const room = rooms.find((r) => r.id === activeRoom);
    return (
      <div className="personal-chat-active">
        <button className="personal-chat-back" onClick={() => setActiveRoom(null)}>
          ← К списку бесед
        </button>
        <h2 className="personal-chat-room-title">{room?.name || 'Беседа'}</h2>
        <ChatWindow roomId={activeRoom} />
      </div>
    );
  }

  return (
    <div className="personal-chat-page">
      <h1 className="personal-chat-title">Личные беседы</h1>

      <div className="personal-chat-list">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="personal-chat-card"
            onClick={() => setActiveRoom(room.id)}
          >
            <div className="personal-chat-card-info">
              <h3 className="personal-chat-card-name">{room.name}</h3>
              {room.lastMessage && (
                <p className="personal-chat-card-preview">
                  {room.lastMessage.length > 80
                    ? room.lastMessage.slice(0, 80) + '...'
                    : room.lastMessage}
                </p>
              )}
              {!room.lastMessage && (
                <p className="personal-chat-card-preview personal-chat-card-preview--empty">
                  Нет сообщений
                </p>
              )}
            </div>

            <div className="personal-chat-card-meta">
              {room.lastMessageAt && (
                <span className="personal-chat-card-time">
                  {formatTime(room.lastMessageAt)}
                </span>
              )}
              {room.unreadCount > 0 && (
                <span className="personal-chat-card-badge">{room.unreadCount}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  if (d.toDateString() === now.toDateString()) return time;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'вчера';

  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}
