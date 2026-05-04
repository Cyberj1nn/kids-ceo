-- 018_must_change_password.sql
-- Флаг обязательной смены пароля при следующем входе.
-- Ставится в true при создании пользователя админом и при сбросе пароля.
-- Сбрасывается в false, когда пользователь сам меняет пароль через PUT /api/auth/password.

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;
