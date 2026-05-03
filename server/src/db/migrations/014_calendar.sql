-- 014_calendar.sql
-- Календарь событий: вкладка + таблица событий

-- Добавляем вкладку Календарь (sort_order = 0, чтобы была первой в сайдбаре)
INSERT INTO tabs (slug, name, sort_order) VALUES ('calendar', 'Календарь', 0)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

-- Таблица событий календаря
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    link TEXT,
    start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    notified_1h_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    notified_5min_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_start_at
    ON calendar_events(start_at)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_calendar_events_pending_1h
    ON calendar_events(start_at)
    WHERE deleted_at IS NULL AND notified_1h_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_calendar_events_pending_5min
    ON calendar_events(start_at)
    WHERE deleted_at IS NULL AND notified_5min_at IS NULL;

CREATE TRIGGER trg_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
