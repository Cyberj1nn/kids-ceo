-- 021_focus_group_and_chat.sql
-- Новая группа "Фокус на результат. Предприниматели" + чат "Беседа Фокус"

-- =====================
-- 1. Новая вкладка + general-комната
-- =====================
INSERT INTO tabs (slug, name, sort_order) VALUES
    ('beseda-fokus', 'Беседа Фокус', 16)
ON CONFLICT (slug) DO UPDATE
    SET name = EXCLUDED.name,
        sort_order = EXCLUDED.sort_order;

INSERT INTO chat_rooms (id, type, name, tab_slug) VALUES
    ('00000000-0000-0000-0000-000000000014', 'general', 'Беседа Фокус', 'beseda-fokus')
ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name,
        tab_slug = EXCLUDED.tab_slug;

-- Все текущие admin/mentor/superadmin — в новый general-чат
INSERT INTO chat_room_members (chat_room_id, user_id)
SELECT cr.id, u.id
  FROM chat_rooms cr
  CROSS JOIN users u
 WHERE cr.id = '00000000-0000-0000-0000-000000000014'
   AND u.role IN ('admin', 'mentor', 'superadmin')
   AND u.deleted_at IS NULL
ON CONFLICT DO NOTHING;

-- =====================
-- 2. Новая группа + mapping на новую вкладку
-- =====================
DO $$
DECLARE
    superadmin_id UUID;
    focus_group_id UUID;
    focus_tab_id INT;
BEGIN
    SELECT id INTO superadmin_id
      FROM users
     WHERE role = 'superadmin' AND deleted_at IS NULL
     ORDER BY created_at
     LIMIT 1;

    IF superadmin_id IS NULL THEN
        RAISE NOTICE 'Суперадмин не найден — seed.ts создаст группу позже';
        RETURN;
    END IF;

    -- Создать группу идемпотентно (case-insensitive по активным)
    SELECT id INTO focus_group_id
      FROM user_groups
     WHERE lower(name) = lower('Фокус на результат. Предприниматели')
       AND deleted_at IS NULL
     LIMIT 1;

    IF focus_group_id IS NULL THEN
        INSERT INTO user_groups (name, created_by)
        VALUES ('Фокус на результат. Предприниматели', superadmin_id)
        RETURNING id INTO focus_group_id;
    END IF;

    -- Mapping: только вкладка beseda-fokus
    SELECT id INTO focus_tab_id FROM tabs WHERE slug = 'beseda-fokus';

    INSERT INTO user_group_tab_defaults (group_id, tab_id)
    VALUES (focus_group_id, focus_tab_id)
    ON CONFLICT DO NOTHING;

    -- Backfill (на случай, если группа уже была с участниками): открыть им вкладку и добавить в чат
    INSERT INTO user_tab_access (user_id, tab_id, granted_by)
    SELECT m.user_id, focus_tab_id, superadmin_id
      FROM user_group_members m
     WHERE m.group_id = focus_group_id
    ON CONFLICT DO NOTHING;

    INSERT INTO chat_room_members (chat_room_id, user_id)
    SELECT '00000000-0000-0000-0000-000000000014', m.user_id
      FROM user_group_members m
     WHERE m.group_id = focus_group_id
    ON CONFLICT DO NOTHING;
END
$$;
