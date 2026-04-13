import { forwardRef, Fragment } from 'react';
import type { Message } from '../api/chat';
import { useAuth } from '../context/AuthContext';
import './MessageList.css';

interface MessageListProps {
  messages: Message[];
  onScrollTop: () => void;
  loading: boolean;
  typingUser: string | null;
  onReply: (msg: Message) => void;
}

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Суперадмин',
  admin: 'Админ',
  mentor: 'Наставник',
};

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Сегодня';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Вчера';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  ({ messages, onScrollTop, loading, typingUser, onReply }, ref) => {
    const { user } = useAuth();

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      if (el.scrollTop === 0 && !loading) onScrollTop();
    };

    return (
      <div className="message-list" ref={ref} onScroll={handleScroll}>
        {loading && <div className="message-list-loader">Загрузка...</div>}

        {messages.map((msg, i) => {
          const isOwn = msg.senderId === user?.id;
          const roleLabel = ROLE_LABELS[msg.senderRole];

          const prevMsg = i > 0 ? messages[i - 1] : null;
          const nextMsg = i < messages.length - 1 ? messages[i + 1] : null;

          // Разделитель по дате
          const showDateSep = !prevMsg || !isSameDay(msg.createdAt, prevMsg.createdAt);

          // Группировка: тот же автор + тот же день + менее 5 минут
          const timeDiff = prevMsg
            ? new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime()
            : Infinity;
          const isGrouped =
            !showDateSep &&
            prevMsg?.senderId === msg.senderId &&
            timeDiff < 5 * 60 * 1000;

          // Компактный нижний отступ если следующее — продолжение группы
          const nextTimeDiff = nextMsg
            ? new Date(nextMsg.createdAt).getTime() - new Date(msg.createdAt).getTime()
            : Infinity;
          const nextIsSameGroup =
            nextMsg &&
            nextMsg.senderId === msg.senderId &&
            nextTimeDiff < 5 * 60 * 1000 &&
            isSameDay(msg.createdAt, nextMsg.createdAt);

          return (
            <Fragment key={msg.id}>
              {showDateSep && (
                <div className="message-date-sep">
                  <span>{formatDateLabel(msg.createdAt)}</span>
                </div>
              )}

              <div
                className={[
                  'message',
                  isOwn ? 'message--own' : '',
                  isGrouped ? 'message--grouped' : '',
                  nextIsSameGroup ? 'message--compact-bottom' : '',
                ].filter(Boolean).join(' ')}
              >
                <div className="message-inner">
                  <div className="message-bubble">
                    {!isOwn && !isGrouped && (
                      <div className="message-sender">
                        <span className="message-sender-name">{msg.senderName}</span>
                        {roleLabel && <span className="message-sender-role">{roleLabel}</span>}
                      </div>
                    )}

                    {msg.replyToId && (
                      <div className="message-reply-quote">
                        <span className="message-reply-quote-name">{msg.replyToSender}</span>
                        <span className="message-reply-quote-text">{msg.replyToText}</span>
                      </div>
                    )}

                    <div className="message-text">{msg.text}</div>

                    <div className="message-meta">
                      <span className="message-time">{formatTime(msg.createdAt)}</span>
                      {isOwn && (
                        <span
                          className={`message-read-status ${msg.read ? 'message-read-status--read' : ''}`}
                        >
                          {msg.read ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    className="message-reply-btn"
                    onClick={() => onReply(msg)}
                    title="Ответить"
                    type="button"
                  >
                    ↩
                  </button>
                </div>
              </div>
            </Fragment>
          );
        })}

        {typingUser && (
          <div className="message-typing">{typingUser} печатает...</div>
        )}
      </div>
    );
  }
);

MessageList.displayName = 'MessageList';
export default MessageList;
