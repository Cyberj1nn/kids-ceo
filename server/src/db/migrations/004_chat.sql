-- 004_chat.sql
-- Таблицы чатов: chat_rooms, chat_room_members, messages, message_read_status

CREATE TYPE chat_room_type AS ENUM ('general', 'personal');

-- =====================
-- Комнаты чата
-- =====================
CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type chat_room_type NOT NULL,
    name VARCHAR(200) DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================
-- Участники комнат
-- =====================
CREATE TABLE chat_room_members (
    chat_room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (chat_room_id, user_id)
);

CREATE INDEX idx_chat_room_members_user ON chat_room_members(user_id);

-- =====================
-- Сообщения
-- =====================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE INDEX idx_messages_room_created ON messages(chat_room_id, created_at DESC);

-- =====================
-- Статус прочтения
-- =====================
CREATE TABLE message_read_status (
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (message_id, user_id)
);

CREATE INDEX idx_message_read_status_user ON message_read_status(user_id);

-- =====================
-- Seed: общая комната "Беседа"
-- =====================
INSERT INTO chat_rooms (id, type, name) VALUES
    ('00000000-0000-0000-0000-000000000001', 'general', 'Беседа');
