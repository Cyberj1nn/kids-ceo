-- 003_content.sql
-- Таблицы контента: content_items, attachments

CREATE TYPE content_type AS ENUM ('text', 'video', 'podcast', 'book', 'film');
CREATE TYPE file_type AS ENUM ('image', 'pdf', 'audio', 'other');

-- =====================
-- Контент (лекции, инструкции, подкасты, книги, фильмы, программы, марафоны)
-- =====================
CREATE TABLE content_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id INT REFERENCES categories(id) ON DELETE CASCADE,
    tab_id INT NOT NULL REFERENCES tabs(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(500) NOT NULL,
    body TEXT DEFAULT '',
    content_type content_type NOT NULL DEFAULT 'text',
    video_url VARCHAR(1000) DEFAULT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE INDEX idx_content_items_category ON content_items(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_content_items_tab ON content_items(tab_id) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_content_items_updated_at
    BEFORE UPDATE ON content_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- =====================
-- Вложения (файлы к контенту)
-- =====================
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    file_type file_type NOT NULL DEFAULT 'other',
    file_url VARCHAR(1000) NOT NULL,
    file_size INT NOT NULL DEFAULT 0,
    original_name VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attachments_content ON attachments(content_item_id);
