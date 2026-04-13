-- 005_dtp.sql
-- Таблицы ДТП: dtp_entries, dtp_audit_log

CREATE TABLE dtp_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    year INT NOT NULL,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    week INT NOT NULL CHECK (week BETWEEN 1 AND 5),
    day_index INT NOT NULL CHECK (day_index BETWEEN 1 AND 7),
    entry_date DATE NOT NULL,
    achievements TEXT NOT NULL DEFAULT '',
    difficulties TEXT NOT NULL DEFAULT '',
    suggestions TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, year, month, week, day_index)
);

CREATE INDEX idx_dtp_entries_user_period ON dtp_entries(user_id, year, month);

CREATE TRIGGER trg_dtp_entries_updated_at
    BEFORE UPDATE ON dtp_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TABLE dtp_audit_log (
    id BIGSERIAL PRIMARY KEY,
    dtp_entry_id UUID NOT NULL REFERENCES dtp_entries(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    field_changed VARCHAR(50) NOT NULL,
    old_value TEXT NOT NULL DEFAULT '',
    new_value TEXT NOT NULL DEFAULT '',
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dtp_audit_entry ON dtp_audit_log(dtp_entry_id);
CREATE INDEX idx_dtp_audit_user_period ON dtp_audit_log(user_id, changed_at);
