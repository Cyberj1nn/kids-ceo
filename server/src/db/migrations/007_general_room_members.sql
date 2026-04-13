-- 007_general_room_members.sql
-- Добавить всех существующих пользователей в общую комнату "Беседа"

INSERT INTO chat_room_members (chat_room_id, user_id)
SELECT '00000000-0000-0000-0000-000000000001', u.id
FROM users u
WHERE u.deleted_at IS NULL
ON CONFLICT DO NOTHING;
