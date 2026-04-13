import { useState, useRef, type KeyboardEvent } from 'react';
import './MessageInput.css';

const EMOJI_LIST = ['😀', '😂', '😊', '😍', '👍', '👏', '🔥', '❤️', '🎉', '✅', '😢', '🤔', '😎', '🙏', '💪', '⭐'];

interface MessageInputProps {
  onSend: (text: string) => void;
  onTyping: () => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, onTyping, disabled }: MessageInputProps) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (value: string) => {
    setText(value);
    onTyping();
  };

  const insertEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  return (
    <div className="message-input">
      {showEmoji && (
        <div className="message-input-emoji-panel">
          {EMOJI_LIST.map((e) => (
            <button key={e} className="message-input-emoji-btn" onClick={() => insertEmoji(e)}>
              {e}
            </button>
          ))}
        </div>
      )}

      <div className="message-input-row">
        <button
          className={`message-input-emoji-toggle ${showEmoji ? 'message-input-emoji-toggle--active' : ''}`}
          onClick={() => setShowEmoji(!showEmoji)}
          title="Эмодзи"
          type="button"
        >
          😊
        </button>

        <textarea
          ref={inputRef}
          className="message-input-field"
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Введите сообщение..."
          rows={1}
          disabled={disabled}
        />

        <button
          className="message-input-send"
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          title="Отправить"
          type="button"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
