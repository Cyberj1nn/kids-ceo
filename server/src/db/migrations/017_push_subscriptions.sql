-- 017_push_subscriptions.sql
-- Web Push API: подписки устройств на пуш-уведомления.
-- Тихие часы (23:00–8:00) применяются на уровне сервиса по полю timezone.

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    timezone TEXT NOT NULL DEFAULT 'Europe/Moscow',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_active
    ON push_subscriptions (user_id)
    WHERE deleted_at IS NULL;

-- Расширяем notification_kind: новый контент и ежедневное напоминание ДТП
ALTER TYPE notification_kind ADD VALUE IF NOT EXISTS 'content_new';
ALTER TYPE notification_kind ADD VALUE IF NOT EXISTS 'dtp_reminder';
