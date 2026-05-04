-- 020_recurring_events.sql
-- Повторяющиеся события календаря: серия событий с общим recurrence_id

ALTER TABLE calendar_events
    ADD COLUMN IF NOT EXISTS recurrence_id UUID,
    ADD COLUMN IF NOT EXISTS recurrence_pattern JSONB;

-- Индекс для быстрого поиска событий серии
CREATE INDEX IF NOT EXISTS idx_calendar_events_recurrence
    ON calendar_events(recurrence_id, start_at)
    WHERE recurrence_id IS NOT NULL AND deleted_at IS NULL;
