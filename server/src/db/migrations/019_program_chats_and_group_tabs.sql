-- 019_program_chats_and_group_tabs.sql
-- 4 программных чата (Архетипы/Опора/Отношения/Финансы) + связь chat_rooms ↔ tab + mapping группа→вкладки

-- =====================
-- 1. Связь chat_rooms ↔ tab (для general-чатов)
-- =====================
ALTER TABLE chat_rooms
    ADD COLUMN IF NOT EXISTS tab_slug VARCHAR(50);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_chat_rooms_tab_slug
    ON chat_rooms(tab_slug)
    WHERE tab_slug IS NOT NULL;

-- Существующая общая беседа: переименовать + связать с вкладкой beseda
UPDATE chat_rooms
   SET tab_slug = 'beseda',
       name = 'Общая беседа'
 WHERE id = '00000000-0000-0000-0000-000000000001';

UPDATE tabs
   SET name = 'Общая беседа'
 WHERE slug = 'beseda';

-- =====================
-- 2. Новые вкладки и привязанные к ним general-комнаты
-- =====================
INSERT INTO tabs (slug, name, sort_order) VALUES
    ('beseda-arkhetipy',  'Беседа Архетипы',  12),
    ('beseda-opora',      'Беседа Опора',     13),
    ('beseda-otnosheniya','Беседа Отношения', 14),
    ('beseda-finansy',    'Беседа Финансы',   15)
ON CONFLICT (slug) DO UPDATE
    SET name = EXCLUDED.name,
        sort_order = EXCLUDED.sort_order;

INSERT INTO chat_rooms (id, type, name, tab_slug) VALUES
    ('00000000-0000-0000-0000-000000000010', 'general', 'Беседа Архетипы',  'beseda-arkhetipy'),
    ('00000000-0000-0000-0000-000000000011', 'general', 'Беседа Опора',     'beseda-opora'),
    ('00000000-0000-0000-0000-000000000012', 'general', 'Беседа Отношения', 'beseda-otnosheniya'),
    ('00000000-0000-0000-0000-000000000013', 'general', 'Беседа Финансы',   'beseda-finansy')
ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name,
        tab_slug = EXCLUDED.tab_slug;

-- Все текущие admin/mentor/superadmin — в новые general-комнаты,
-- иначе они не смогут писать туда (chat.ts проверяет membership)
INSERT INTO chat_room_members (chat_room_id, user_id)
SELECT cr.id, u.id
  FROM chat_rooms cr
  CROSS JOIN users u
 WHERE cr.id IN (
        '00000000-0000-0000-0000-000000000010',
        '00000000-0000-0000-0000-000000000011',
        '00000000-0000-0000-0000-000000000012',
        '00000000-0000-0000-0000-000000000013'
       )
   AND u.role IN ('admin', 'mentor', 'superadmin')
   AND u.deleted_at IS NULL
ON CONFLICT DO NOTHING;

-- =====================
-- 3. Mapping группа → вкладки, открываемые по умолчанию при добавлении пользователя в группу
-- =====================
CREATE TABLE IF NOT EXISTS user_group_tab_defaults (
    group_id UUID NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
    tab_id INT NOT NULL REFERENCES tabs(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, tab_id)
);

CREATE INDEX IF NOT EXISTS idx_user_group_tab_defaults_tab
    ON user_group_tab_defaults(tab_id);

-- =====================
-- 4. Сидим группы и mapping (только если суперадмин уже создан — иначе seed.ts сделает позже)
-- =====================
DO $$
DECLARE
    superadmin_id UUID;
BEGIN
    SELECT id INTO superadmin_id
      FROM users
     WHERE role = 'superadmin' AND deleted_at IS NULL
     ORDER BY created_at
     LIMIT 1;

    IF superadmin_id IS NULL THEN
        RAISE NOTICE 'Суперадмин не найден — seed.ts создаст группы позже';
        RETURN;
    END IF;

    -- Создаём 6 групп идемпотентно (по case-insensitive имени среди активных)
    INSERT INTO user_groups (name, created_by)
    SELECT v.name, superadmin_id
      FROM (VALUES
              ('Клуб'),
              ('Личка'),
              ('Программа Архетипы'),
              ('Программа Опора'),
              ('Программа Отношения'),
              ('Программа Финансы')
           ) AS v(name)
     WHERE NOT EXISTS (
        SELECT 1 FROM user_groups g
         WHERE lower(g.name) = lower(v.name) AND g.deleted_at IS NULL
     );

    -- Mapping группа → вкладки
    INSERT INTO user_group_tab_defaults (group_id, tab_id)
    SELECT g.id, t.id
      FROM user_groups g
      JOIN tabs t ON t.slug = ANY(
          CASE lower(g.name)
              WHEN 'клуб'                THEN ARRAY['beseda','marathons','lectures','books','instructions','podcasts','films','program-360']
              WHEN 'личка'               THEN ARRAY['personal-chat','marathons','dtp','call-tracker']
              WHEN 'программа архетипы'  THEN ARRAY['beseda-arkhetipy']
              WHEN 'программа опора'     THEN ARRAY['beseda-opora']
              WHEN 'программа отношения' THEN ARRAY['beseda-otnosheniya']
              WHEN 'программа финансы'   THEN ARRAY['beseda-finansy']
              ELSE ARRAY[]::text[]
          END
      )
     WHERE g.deleted_at IS NULL
       AND lower(g.name) IN (
            'клуб','личка',
            'программа архетипы','программа опора',
            'программа отношения','программа финансы'
       )
    ON CONFLICT DO NOTHING;

    -- Backfill: уже существующим участникам этих групп открыть дефолтные вкладки
    -- (только добавляем, ручные настройки админа не сбрасываются)
    INSERT INTO user_tab_access (user_id, tab_id, granted_by)
    SELECT m.user_id, d.tab_id, superadmin_id
      FROM user_group_members m
      JOIN user_groups g ON g.id = m.group_id AND g.deleted_at IS NULL
      JOIN user_group_tab_defaults d ON d.group_id = g.id
    ON CONFLICT DO NOTHING;

    -- Backfill: членство в general-чатах для участников групп
    INSERT INTO chat_room_members (chat_room_id, user_id)
    SELECT cr.id, m.user_id
      FROM user_group_members m
      JOIN user_groups g ON g.id = m.group_id AND g.deleted_at IS NULL
      JOIN user_group_tab_defaults d ON d.group_id = g.id
      JOIN tabs t ON t.id = d.tab_id
      JOIN chat_rooms cr ON cr.tab_slug = t.slug AND cr.type = 'general'
    ON CONFLICT DO NOTHING;
END
$$;
