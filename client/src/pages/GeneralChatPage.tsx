import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ChatWindow from '../components/ChatWindow';
import { getChatRooms } from '../api/chat';

export default function GeneralChatPage() {
  const location = useLocation();
  const slug = location.pathname.replace(/^\/+/, '').split('/')[0];

  const [roomId, setRoomId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRoomId(null);
    setError(null);
    getChatRooms()
      .then((rooms) => {
        const room = rooms.find((r) => r.type === 'general' && r.tabSlug === slug);
        if (room) setRoomId(room.id);
        else setError('Чат не найден или у вас нет доступа');
      })
      .catch(() => setError('Не удалось загрузить чат'));
  }, [slug]);

  if (error) {
    return <div style={{ padding: 24, textAlign: 'center', opacity: 0.7 }}>{error}</div>;
  }

  if (!roomId) {
    return <div style={{ padding: 24, textAlign: 'center', opacity: 0.7 }}>Загрузка...</div>;
  }

  return <ChatWindow roomId={roomId} />;
}
