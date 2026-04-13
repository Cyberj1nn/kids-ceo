-- 008_content_blocks.sql
-- Добавляем колонку blocks (JSONB) для блочного контента
-- Формат блока: { id, type: 'text'|'video'|'image'|'file', content?, url?, fileUrl?, originalName?, fileSize?, fileType? }
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS blocks JSONB DEFAULT NULL;
