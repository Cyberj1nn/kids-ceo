-- 001_initial_schema.sql
-- Начальная схема БД: users, tabs, user_tab_access, categories

-- Расширение для UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Тип роли пользователя
CREATE TYPE user_role AS ENUM ('user', 'admin', 'superadmin', 'mentor');

-- =====================
-- Таблица пользователей
-- =====================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    login VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE INDEX idx_users_login ON users(login) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role) WHERE deleted_at IS NULL;

-- =====================
-- Таблица вкладок
-- =====================
CREATE TABLE tabs (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0
);

-- =====================
-- Доступ пользователей к вкладкам
-- =====================
CREATE TABLE user_tab_access (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tab_id INT NOT NULL REFERENCES tabs(id) ON DELETE CASCADE,
    granted_by UUID NOT NULL REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, tab_id)
);

CREATE INDEX idx_user_tab_access_user ON user_tab_access(user_id);

-- =====================
-- Подкатегории вкладок
-- =====================
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    tab_id INT NOT NULL REFERENCES tabs(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    UNIQUE(tab_id, slug)
);

CREATE INDEX idx_categories_tab ON categories(tab_id);

-- =====================
-- Триггер обновления updated_at
-- =====================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
