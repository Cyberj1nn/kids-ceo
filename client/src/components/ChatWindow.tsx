import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getMessages, sendMessage, markAsRead, type Message } from '../api/chat';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import './ChatWindow.css';


interface ChatWindowProps {
  roomId: string;
}

export default function ChatWindow({ roomId }: ChatWindowProps) {
  const { user } = useAuth();
  const socket = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldScrollRef = useRef(true);

  // Загрузка начальных сообщений
  useEffect(() => {
    setLoading(true);
    setMessages([]);
    setHasMore(true);
    shouldScrollRef.current = true;

    getMessages(roomId)
      .then((msgs) => {
        setMessages(msgs);
        setHasMore(msgs.length >= 30);
        markAsRead(roomId)
          .then(() => window.dispatchEvent(new CustomEvent('chat:read')))
          .catch(() => {});
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [roomId]);

  // Автоскролл вниз после загрузки и новых сообщений
  useEffect(() => {
    if (shouldScrollRef.current && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // WebSocket: новые сообщения
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: { roomId: string; message: Message }) => {
      if (data.roomId !== roomId) return;

      setMessages((prev) => {
        if (prev.some((m) => m.id === data.message.id)) return prev;
        return [...prev, data.message];
      });
      shouldScrollRef.current = true;

      // Автопрочтение если не своё
      if (data.message.senderId !== user?.id) {
        markAsRead(roomId)
          .then(() => window.dispatchEvent(new CustomEvent('chat:read')))
          .catch(() => {});
      }
    };

    const handleTyping = (data: { roomId: string; userId: string }) => {
      if (data.roomId !== roomId || data.userId === user?.id) return;
      // Показываем "печатает..." на 2 секунды
      setTypingUser(data.userId);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 2000);
    };

    const handleRoomRead = (data: { roomId: string; readByUserId: string }) => {
      if (data.roomId !== roomId || data.readByUserId === user?.id) return;
      // Помечаем все свои сообщения как прочитанные
      setMessages((prev) =>
        prev.map((m) =>
          m.senderId === user?.id && !m.read ? { ...m, read: true } : m
        )
      );
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:typing', handleTyping);
    socket.on('room:read', handleRoomRead);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:typing', handleTyping);
      socket.off('room:read', handleRoomRead);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [socket, roomId, user?.id]);

  // Подгрузка старых сообщений
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    shouldScrollRef.current = false;

    const oldestTime = messages[0].createdAt;
    const prevScrollHeight = listRef.current?.scrollHeight || 0;

    getMessages(roomId, oldestTime)
      .then((older) => {
        if (older.length < 30) setHasMore(false);
        if (older.length > 0) {
          setMessages((prev) => [...older, ...prev]);
          // Сохранить позицию скролла
          requestAnimationFrame(() => {
            if (listRef.current) {
              listRef.current.scrollTop = listRef.current.scrollHeight - prevScrollHeight;
            }
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoadingMore(false));
  }, [loadingMore, hasMore, messages, roomId]);

  // Отправка сообщения
  const handleSend = async (text: string) => {
    try {
      shouldScrollRef.current = true;
      const msg = await sendMessage(roomId, text, replyTo?.id);
      setReplyTo(null);
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    } catch (err) {
      console.error('Send error:', err);
    }
  };

  const handleReply = (msg: Message) => setReplyTo(msg);
  const cancelReply = () => setReplyTo(null);

  // Typing indicator
  const emitTypingRef = useRef<number>(0);
  const handleTyping = () => {
    if (!socket) return;
    const now = Date.now();
    if (now - emitTypingRef.current > 1000) {
      socket.emit('message:typing', { roomId });
      emitTypingRef.current = now;
    }
  };

  if (loading) {
    return <div className="chat-window-loading">Загрузка чата...</div>;
  }

  return (
    <div className="chat-window">
      <MessageList
        ref={listRef}
        messages={messages}
        onScrollTop={loadMore}
        loading={loadingMore}
        typingUser={typingUser ? 'Кто-то' : null}
        onReply={handleReply}
      />
      <MessageInput
        onSend={handleSend}
        onTyping={handleTyping}
        replyTo={replyTo}
        onCancelReply={cancelReply}
      />
    </div>
  );
}
