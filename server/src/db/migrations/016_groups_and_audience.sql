-- 016_groups_and_audience.sql
-- Группы пользователей + audience для событий календаря

-- =====================
-- Группы пользователей
-- =====================
CREATE TABLE IF NOT EXISTS user_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_user_groups_name_active
    ON user_groups (lower(name))
    WHERE deleted_at IS NULL;

CREATE TRIGGER trg_user_groups_updated_at
    BEFORE UPDATE ON user_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- =====================
-- Членство пользователя в группе
-- =====================
CREATE TABLE IF NOT EXISTS user_group_members (
    group_id UUID NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    added_by UUID NOT NULL REFERENCES users(id),
    added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_group_members_user
    ON user_group_members(user_id);

-- =====================
-- Audience для событий календаря
-- =====================
CREATE TYPE event_audience_type AS ENUM ('all', 'users', 'groups');

ALTER TABLE calendar_events
    ADD COLUMN IF NOT EXISTS audience_type event_audience_type NOT NULL DEFAULT 'all';

-- Конкретные пользователи
CREATE TABLE IF NOT EXISTS calendar_event_users (
    event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_calendar_event_users_user
    ON calendar_event_users(user_id);

-- Группы
CREATE TABLE IF NOT EXISTS calendar_event_groups (
    event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_calendar_event_groups_group
    ON calendar_event_groups(group_id);
