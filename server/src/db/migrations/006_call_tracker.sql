-- 006_call_tracker.sql
-- Таблица трекера созвонов

CREATE TABLE call_tracker (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),
    call_date DATE NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE INDEX idx_call_tracker_user ON call_tracker(user_id) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_call_tracker_updated_at
    BEFORE UPDATE ON call_tracker
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
