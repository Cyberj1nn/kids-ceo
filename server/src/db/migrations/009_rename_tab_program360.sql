-- 009_rename_tab_program360.sql
-- Переименование вкладки "Программа Руководитель 360" → "Руководитель 360"
UPDATE tabs SET name = 'Руководитель 360' WHERE slug = 'program-360';
