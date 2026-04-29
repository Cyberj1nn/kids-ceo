-- 013_categories_parent.sql
-- Добавляет parent_id в categories и seed подкатегорий для вкладки "Инструкции"

ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS parent_id INT NULL REFERENCES categories(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);

DO $$
DECLARE
    instructions_tab_id INT;
    team_id INT;
    marketing_id INT;
    sales_id INT;
BEGIN
    SELECT id INTO instructions_tab_id FROM tabs WHERE slug = 'instructions';
    IF instructions_tab_id IS NULL THEN
        RAISE NOTICE 'Tab "instructions" not found, skipping subcategory seed';
        RETURN;
    END IF;

    SELECT id INTO team_id      FROM categories WHERE tab_id = instructions_tab_id AND slug = 'team'      AND parent_id IS NULL;
    SELECT id INTO marketing_id FROM categories WHERE tab_id = instructions_tab_id AND slug = 'marketing' AND parent_id IS NULL;
    SELECT id INTO sales_id     FROM categories WHERE tab_id = instructions_tab_id AND slug = 'sales'     AND parent_id IS NULL;

    -- Команда: Найм / Ассистент / Команда
    IF team_id IS NOT NULL THEN
        INSERT INTO categories (tab_id, parent_id, name, slug, sort_order) VALUES
            (instructions_tab_id, team_id, 'Найм',      'team-hiring',    1),
            (instructions_tab_id, team_id, 'Ассистент', 'team-assistant', 2),
            (instructions_tab_id, team_id, 'Команда',   'team-team',      3)
        ON CONFLICT (tab_id, slug) DO NOTHING;
    END IF;

    -- Маркетинг: Анализ / Социальные сети / Каналы привлечения
    IF marketing_id IS NOT NULL THEN
        INSERT INTO categories (tab_id, parent_id, name, slug, sort_order) VALUES
            (instructions_tab_id, marketing_id, 'Анализ',              'marketing-analysis', 1),
            (instructions_tab_id, marketing_id, 'Социальные сети',     'marketing-social',   2),
            (instructions_tab_id, marketing_id, 'Каналы привлечения',  'marketing-channels', 3)
        ON CONFLICT (tab_id, slug) DO NOTHING;
    END IF;

    -- Продажи: Клиенты / Менеджер
    IF sales_id IS NOT NULL THEN
        INSERT INTO categories (tab_id, parent_id, name, slug, sort_order) VALUES
            (instructions_tab_id, sales_id, 'Клиенты',  'sales-clients', 1),
            (instructions_tab_id, sales_id, 'Менеджер', 'sales-manager', 2)
        ON CONFLICT (tab_id, slug) DO NOTHING;
    END IF;
END $$;
