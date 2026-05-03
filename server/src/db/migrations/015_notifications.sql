-- 015_notifications.sql
-- Внутриплатформенные уведомления (без Web Push)
-- Используются для NotificationBell + Badging API на иконке PWA

CREATE TYPE notification_kind AS ENUM (
    'event_1h',
    'event_5min',
    'personal_message'
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind notification_kind NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT,
    link TEXT,
    payload JSONB,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
    ON notifications(user_id, created_at DESC)
    WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user_recent
    ON notifications(user_id, created_at DESC);
