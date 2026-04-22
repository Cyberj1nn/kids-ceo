-- 012_file_type_ebook.sql
-- Добавляем значение 'ebook' в ENUM file_type (EPUB, FB2, MOBI, RTF, DOC, DOCX, TXT)

ALTER TYPE file_type ADD VALUE IF NOT EXISTS 'ebook';
