import { forwardRef } from 'react';
import type { Message } from '../api/chat';
import { useAuth } from '../context/AuthContext';
import './MessageList.css';

interface MessageListProps {
  messages: Message[];
  onScrollTop: () => void;
  loading: boolean;
  typingUser: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Суперадмин',
  admin: 'Админ',
  mentor: 'Наставник',
};

const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  ({ messages, onScrollTop, loading, typingUser }, ref) => {
    const { user } = useAuth();

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      if (el.scrollTop === 0 && !loading) {
        onScrollTop();
      }
    };

    const formatTime = (iso: string) => {
      const d = new Date(iso);
      const now = new Date();
      const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

      if (d.toDateString() === now.toDateString()) return time;

      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) return `вчера ${time}`;

      return `${d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} ${time}`;
    };

    return (
      <div className="message-list" ref={ref} onScroll={handleScroll}>
        {loading && <div className="message-list-loader">Загрузка...</div>}

        {messages.map((msg) => {
          const isOwn = msg.senderId === user?.id;
          const roleLabel = ROLE_LABELS[msg.senderRole];

          return (
            <div key={msg.id} className={`message ${isOwn ? 'message--own' : ''}`}>
              <div className="message-bubble">
                {!isOwn && (
                  <div className="message-sender">
                    <span className="message-sender-name">{msg.senderName}</span>
                    {roleLabel && <span className="message-sender-role">{roleLabel}</span>}
                  </div>
                )}
                <div className="message-text">{msg.text}</div>
                <div className="message-time">{formatTime(msg.createdAt)}</div>
              </div>
            </div>
          );
        })}

        {typingUser && (
          <div className="message-typing">
            {typingUser} печатает...
          </div>
        )}
      </div>
    );
  }
);

MessageList.displayName = 'MessageList';
export default MessageList;
