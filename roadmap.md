# Kids CEO / Malafeeva School — Roadmap

> Стек: React (Vite) + Node.js/Express + PostgreSQL + Socket.io  
> Домен: kids-ceo.ru | Сервер: Ubuntu (Beget) | Деплой: GitHub + автодеплой

---

## Фаза 1. Инициализация проекта и каркас

### 1.1. Структура проекта
- [x] Инициализировать Git-репозиторий
- [x] Создать монорепо-структуру: `client/` и `server/`
- [x] Настроить `.gitignore` (node_modules, .env, dist, uploads)
- [x] Создать `.env.example` с шаблоном переменных окружения

### 1.2. Backend — базовая настройка
- [x] Инициализировать `server/` (TypeScript + Express)
- [x] Настроить `tsconfig.json`, скрипты сборки и dev-режим (nodemon/tsx)
- [x] Подключить PostgreSQL (пул соединений через `pg` или Prisma)
- [x] Настроить CORS, body-parser, helmet, rate-limiter
- [x] Создать структуру папок: `routes/`, `middleware/`, `db/`, `socket/`, `uploads/`

### 1.3. База данных — начальная миграция
- [x] Таблица `users` (id UUID, first_name, last_name, login UNIQUE, password_hash, role ENUM[user, admin, superadmin, mentor], created_at, updated_at, deleted_at)
- [x] Таблица `tabs` (id, slug UNIQUE, name, sort_order) + seed 11 вкладок
- [x] Таблица `user_tab_access` (user_id FK, tab_id FK, granted_by FK, granted_at)
- [x] Таблица `categories` (id, tab_id FK, name, slug, sort_order) + seed подкатегорий
- [x] Создать суперадмин-аккаунт (seed)

### 1.4. Аутентификация (JWT)
- [x] `POST /api/auth/login` — вход по логину/паролю, возврат access + refresh токенов
- [x] `POST /api/auth/refresh` — обновление access-токена
- [x] `POST /api/auth/logout` — инвалидация refresh-токена
- [x] Middleware `authJWT` — проверка access-токена на каждом защищённом роуте
- [x] Middleware `roleCheck(roles[])` — проверка роли (RBAC)
- [x] Хеширование паролей через bcrypt

### 1.5. Frontend — базовая настройка
- [x] Инициализировать `client/` через Vite (React + TypeScript)
- [x] Установить зависимости: react-router-dom, axios, socket.io-client
- [x] Создать `AuthContext` (хранение токенов, автообновление, редирект на логин)
- [x] Создать axios-инстанс с интерцептором (автоподстановка токена, обработка 401)
- [x] Настроить React Router с защищёнными роутами (PrivateRoute)

### 1.6. UI-скелет и навигация
- [x] Определить цветовую палитру и шрифты (ориентир — skillspace.ru)
- [x] Создать `MainLayout` — sidebar (боковая панель) + header + контентная область
- [x] Sidebar: 11 вкладок, отображение только доступных пользователю (по `user_tab_access`)
- [x] Header: логотип, имя пользователя, иконка уведомлений (NotificationBell)
- [x] Мобильная адаптация: sidebar → гамбургер-меню
- [x] Страница логина (`LoginPage`)
- [x] Заглушка для каждой вкладки (пустая страница с заголовком)

---

## Фаза 2. Контент (Лекции, Инструкции, Подкасты, Книги, Фильмы, Программы, Марафоны)

### 2.1. Backend — контент
- [x] Таблица `content_items` (id UUID, category_id FK, author_id FK, title, body TEXT/JSON, content_type, video_url, sort_order, created_at, updated_at, deleted_at)
- [x] Таблица `attachments` (id UUID, content_item_id FK, file_type ENUM, file_url, file_size, original_name, uploaded_at)
- [x] `GET /api/tabs/:slug/categories` — список подкатегорий вкладки
- [x] `GET /api/categories/:id/content` — список контента в подкатегории (пагинация)
- [x] `GET /api/content/:id` — конкретный материал
- [x] `POST /api/content` — создание материала (admin/mentor)
- [x] `PUT /api/content/:id` — редактирование (admin/mentor)
- [x] `DELETE /api/content/:id` — мягкое удаление (admin/mentor)
- [x] Middleware проверки доступа к вкладке (`tabAccessCheck`)

### 2.2. Загрузка файлов
- [x] `POST /api/upload` — загрузка файлов (multer)
- [x] Хранение в `server/uploads/` (для начала локально, потом можно вынести на S3)
- [x] Лимиты: изображения до 10 МБ, PDF до 50 МБ
- [x] Раздача статики: `GET /uploads/:filename`
- [x] Валидация MIME-типов (только изображения, PDF, аудио)

### 2.3. Frontend — просмотр контента
- [x] Компонент `ContentPage` — универсальная страница для вкладок с подкатегориями (Лекции, Инструкции, Марафоны)
- [x] Компонент `CategoryList` — список подкатегорий (sidebar или карточки)
- [x] Компонент `ContentList` — список материалов в подкатегории
- [x] Компонент `ContentItem` — отображение контента: текст, изображения, PDF-превью, ссылки
- [x] Компонент `VideoEmbed` — встраивание Rutube-видео через iframe + фоллбэк-ссылка
- [x] Компонент `SimplePage` — для вкладок без подкатегорий (Подкасты, Книги, Фильмы)

### 2.4. Frontend — создание/редактирование контента (админ)
- [x] Компонент `ContentEditor` — форма создания/редактирования материала
- [x] Rich-text редактор (TipTap) для поля body
- [x] Компонент `FileUploader` — drag-and-drop загрузка файлов с превью
- [x] Поле для вставки ссылки на Rutube-видео
- [ ] Сортировка материалов внутри подкатегории (drag-and-drop порядок)

### 2.5. Программа Руководитель 360
- [x] Seed подкатегорий: Блок 1 (Старт сезона), Блок 2 (Продажи 1), Блок 3 (Клиенты), Блок 4 (Команда), Блок 5 (Структура), Блок 6 (Продажи 2)
- [x] Используется общий `ContentPage` — без отдельной логики

---

## Фаза 3. Чаты (Беседа + Личная беседа)

### 3.1. Backend — чаты
- [x] Таблица `chat_rooms` (id UUID, type ENUM[general, personal], name, created_at)
- [x] Таблица `chat_room_members` (chat_room_id FK, user_id FK)
- [x] Таблица `messages` (id UUID, chat_room_id FK, sender_id FK, text, created_at, updated_at)
- [x] Таблица `message_read_status` (message_id FK, user_id FK, read_at)
- [x] Seed: создать одну общую комнату (type=general) для вкладки "Беседа"
- [x] При создании пользователя автоматически создавать личную комнату (type=personal) с этим пользователем + все админы/наставники
- [x] `GET /api/chat/rooms` — список комнат пользователя
- [x] `GET /api/chat/rooms/:id/messages?before=<cursor>&limit=30` — сообщения с пагинацией (infinite scroll)
- [x] `POST /api/chat/rooms/:id/messages` — отправка сообщения
- [x] `PUT /api/chat/rooms/:id/read` — пометить как прочитанные
- [x] `GET /api/notifications/unread-count` — количество непрочитанных по личным беседам

### 3.2. Backend — WebSocket (Socket.io)
- [x] Подключение Socket.io к Express-серверу
- [x] Аутентификация WebSocket через JWT (middleware)
- [x] При подключении — join во все комнаты пользователя
- [x] Событие `message:new` — broadcast нового сообщения в комнату
- [x] Событие `message:typing` — индикатор набора (ephemeral)
- [x] Событие `notification:unread` — обновление badge непрочитанных

### 3.3. Frontend — общий чат ("Беседа")
- [x] Компонент `ChatWindow` — список сообщений + поле ввода
- [x] Компонент `MessageList` — отображение сообщений с аватаром, именем, временем
- [x] Компонент `MessageInput` — поле ввода текста + базовые эмодзи + отправка по Enter
- [x] Infinite scroll вверх — подгрузка старых сообщений
- [x] Индикатор "печатает..."
- [x] Автоскролл к последнему сообщению

### 3.4. Frontend — личные беседы
- [x] Компонент `PersonalChatPage` — список личных бесед (для админа/наставника: все пользователи)
- [x] Для пользователя: одна личная беседа
- [x] Для админа/наставника: список "Личная работа [Имя Фамилия]" → переход в конкретный чат
- [x] Переиспользование `ChatWindow`

### 3.5. Уведомления
- [x] Компонент `NotificationBell` — иконка колокольчика в header
- [x] Badge с количеством непрочитанных сообщений в личных беседах
- [x] Обновление badge в реальном времени через WebSocket
- [x] Клик по иконке → переход на вкладку "Личная беседа"

---

## Фаза 4. ДТП (Достижения, Трудности, Предложения)

### 4.1. Backend — ДТП
- [x] Таблица `dtp_entries` (id UUID, user_id FK, year INT, month INT 1-12, week INT 1-5, day_index INT 1-7, entry_date DATE, achievements TEXT, difficulties TEXT, suggestions TEXT, created_at, updated_at)
- [x] Таблица `dtp_audit_log` (id BIGSERIAL, dtp_entry_id FK, user_id FK, field_changed VARCHAR, old_value TEXT, new_value TEXT, changed_at TIMESTAMP)
- [x] `GET /api/dtp?user_id=&year=&month=` — получить все записи ДТП пользователя за месяц
- [x] `POST /api/dtp` — создать запись (пользователь заполняет свою)
- [x] `PUT /api/dtp/:id` — обновить запись + автоматическая запись в audit_log
- [x] `GET /api/dtp/:id/audit` — история изменений записи (admin/mentor)
- [x] `GET /api/dtp/audit?user_id=&year=&month=` — полный audit log по пользователю за месяц (admin/mentor)

### 4.2. Frontend — таблица ДТП
- [x] Компонент `DtpPage` — основная страница
- [x] Селектор месяца (Месяц 01 — Месяц 12) — верхняя панель
- [x] Табы недель (Неделя 1 — Неделя 5) — под селектором месяца
- [x] Компонент `DtpTable` — таблица:
  - Строка 1 (заголовок): даты дней недели (вычисляются автоматически по году/месяцу/неделе)
  - Строка 2: "Достижения" — 7 текстовых полей (inline-редактирование)
  - Строка 3: "Трудности" — 7 текстовых полей
  - Строка 4: "Предложения" — 7 текстовых полей
- [x] Автосохранение при потере фокуса (onBlur) или по debounce
- [x] Цветовое кодирование строк (Д — зелёный/оливковый, Т — красноватый, П — серо-синий, как на скрине)
- [x] Мобильная адаптация: карточный вид (день → 3 поля Д/Т/П) вместо таблицы

### 4.3. Frontend — audit log (для админов/наставников)
- [x] Кнопка "История изменений" рядом с каждой ячейкой (иконка часов)
- [x] Модальное окно `AuditLogModal` — список изменений: дата/время, старое значение → новое значение
- [x] Возможность просмотра ДТП любого пользователя (для админа/наставника — выпадающий список пользователей)

---

## Фаза 5. Трекер созвонов

### 5.1. Backend — трекер
- [x] Таблица `call_tracker` (id UUID, user_id FK — для кого, author_id FK — кто заполнил, call_date DATE, summary TEXT, created_at, updated_at)
- [x] `GET /api/call-tracker?user_id=` — записи по пользователю
- [x] `POST /api/call-tracker` — создать запись (admin/mentor)
- [x] `PUT /api/call-tracker/:id` — обновить запись (admin/mentor)
- [x] `DELETE /api/call-tracker/:id` — мягкое удаление (admin/mentor)

### 5.2. Frontend — трекер
- [x] Компонент `CallTrackerPage` — основная страница
- [x] Для админа/наставника: селектор пользователя сверху
- [x] Компонент `CallTrackerTable` — таблица:
  - Нумерованные строки (01, 02, 03...)
  - Маленькая колонка "Дата" (date-picker)
  - Большая колонка "Краткая информация" — многострочное текстовое поле
- [x] Кнопка "Добавить запись" (admin/mentor)
- [x] Inline-редактирование существующих записей (admin/mentor)
- [x] Для пользователя: только просмотр (без редактирования)

---

## Фаза 6. Админка

### 6.1. Управление пользователями
- [x] Страница `AdminPanel` — доступна только admin/mentor/superadmin
- [x] Компонент `UserTable` — список всех пользователей (имя, фамилия, логин, роль, статус)
- [x] Компонент `UserForm` — создание/редактирование пользователя:
  - Поля: Имя, Фамилия, Логин, Пароль (при создании), Роль (выпадающий список)
  - Суперадмин может назначать роли admin/mentor; обычный admin/mentor — только роль user
- [x] Кнопка "Сбросить пароль" — генерация нового пароля
- [x] Мягкое удаление пользователя (кнопка "Деактивировать")
- [x] Подтверждение удаления через диалог

### 6.2. Управление доступом к вкладкам
- [x] Компонент `TabAccessControl` — чекбокс-матрица: пользователи × вкладки
- [x] Быстрые действия: "Открыть все вкладки", "Закрыть все вкладки"
- [x] Изменения применяются мгновенно (AJAX без перезагрузки)
- [x] При создании пользователя — все вкладки закрыты по умолчанию

---

## Фаза 7. PWA и финализация

### 7.1. PWA
- [x] Файл `manifest.json` (name, short_name, icons, theme_color, background_color, display: standalone)
- [x] Service Worker (ручной `sw.js` — network first, fallback to cache)
- [x] Кеширование статических ресурсов (JS, CSS, шрифты, иконки)
- [x] Иконки приложения (192x192, 512x512) — placeholder, заменить на реальные
- [x] Splash screen для мобильных (через manifest + apple meta tags)

### 7.2. Адаптивная вёрстка (финальная проверка)
- [x] Sidebar → гамбургер-меню на экранах < 768px
- [x] Таблицы ДТП и Трекер → карточный вид на мобильных
- [x] Чат — корректный вид на мобильных (полноэкранный режим)
- [x] ContentPage — одноколоночная раскладка на мобильных
- [x] Touch targets минимум 44px на мобильных

### 7.3. Полировка
- [x] Обработка ошибок: глобальный error boundary (React)
- [x] Состояния загрузки: spinner + skeleton компоненты
- [x] Пустые состояния: информативные заглушки ("Нет материалов", "Нет сообщений")
- [x] Favicon (SVG) и мета-теги (title, description, theme-color, apple meta)
- [x] 404 страница

---

## Фаза 8. Лендинг English Lessons + приём оплат Robokassa

### 8.1. Публичный лендинг `/english_lessons`
- [x] Страница `EnglishLessonsPage` на базе Tilda-HTML (перенос в JSX + вынос CSS)
- [x] Публичный роут (без `PrivateRoute` и `MainLayout`) — `/english_lessons`
- [x] Все 3 кнопки оплаты берут href из `VITE_ROBOKASSA_INVOICE_URL`
- [x] Страницы состояний: `/english_lessons/success`, `/english_lessons/fail`

### 8.2. Backend — обработка платежей
- [x] Миграция `011_payments.sql` — таблица `payments` (inv_id UNIQUE, email, status, raw_params JSONB, email_sent_at)
- [x] Сервис `services/mailer.ts` — nodemailer, шаблон письма + уведомление админу
- [x] Queries `db/queries/payments.ts` — `insertPayment` (ON CONFLICT DO NOTHING) + `markEmailSent`
- [x] Роут `routes/payments.ts` — `GET/POST /api/payments/robokassa/success` и `/fail`, идемпотентность по InvId, редирект на React-страницы
- [x] Конфиг расширен блоками `smtp`, `englishLessons`, `adminNotifyEmail`
- [x] `.env.example` для server и client

### 8.3. Почтовый сервер (Postfix + OpenDKIM) на Beget
- [ ] Конфиги Postfix/OpenDKIM в `deploy/mail/` + скрипт установки
- [ ] Установить Postfix + OpenDKIM + certbot на Ubuntu-сервере
- [ ] Сгенерировать DKIM-ключ, настроить подписание исходящей почты
- [ ] TLS-сертификат Let's Encrypt для `mail.kids-ceo.ru`
- [ ] Открыть тикет в Beget: PTR-запись `46.173.24.16 → mail.kids-ceo.ru`
- [ ] Прописать DNS в reg.ru: A (mail), SPF, DKIM, DMARC, MX
- [ ] Тест отправки через mail-tester.com, целевой score ≥ 9/10

### 8.4. Настройки Robokassa и проды (делает владелец)
- [ ] В кабинете Robokassa включить обязательное поле **Email покупателя**
- [ ] В кабинете Robokassa указать SuccessURL/FailURL (или убедиться, что передаются через параметры Invoice-ссылки)
- [ ] Прописать `.env` на проде (SMTP_*, ADMIN_NOTIFY_EMAIL)
- [ ] Применить миграцию `011_payments.sql` на проде: `npm run migrate`
- [ ] Протестировать цепочку в тестовом режиме Robokassa (тестовая карта → email с Drive-ссылкой)
- [ ] Переключить Robokassa в боевой режим, прогнать реальный платёж

---

## Фаза 9. Календарь, уведомления и PWA-инсталл

### 9.1. Календарь событий
- [x] Миграция `014_calendar.sql` — таблица `calendar_events` (title, description, link, start_at, notified_1h_at, notified_5min_at) + вкладка `calendar` (sort_order=0)
- [x] Backend `routes/calendar.ts` — CRUD событий (GET для всех, POST/PUT/DELETE для admin/mentor/superadmin)
- [x] Доступ к вкладке Календарь открыт всем (PUBLIC_TAB_SLUGS в `routes/tabs.ts`)
- [x] Дефолтный редирект `/` → `/calendar`
- [x] Frontend `pages/CalendarPage.tsx` — список событий по датам (Сегодня / Завтра / Дата)
- [x] Прошедшие события в нижней секции серым цветом
- [x] `components/EventModal.tsx` — модалка просмотра, кнопка "Перейти по ссылке" в новом окне
- [x] `components/EventEditor.tsx` — форма создания/редактирования (admin/mentor/superadmin)
- [x] Иконка 📅 первой строкой в Sidebar
- [x] Seed `calendar` вкладки в `db/seed.ts`

### 9.2. Уведомления (in-app + Badging API)
- [x] Миграция `015_notifications.sql` — таблица `notifications` (kind ENUM, title, body, link, payload, read_at)
- [x] Backend `routes/notifications.ts` — GET список, GET общий счётчик, PUT прочитать одно/все
- [x] Personal-сообщение → notification создаётся, только если получатель не активен в этом чате (трекинг через socket-event `chat:active`)
- [x] Scheduler (setInterval раз в минуту) — `services/scheduler.ts`, окна 59–61 мин и 4–6 мин до старта события, идемпотентность через `notified_1h_at` / `notified_5min_at`
- [x] WebSocket-событие `notification:new` — реал-тайм доставка нового уведомления
- [x] WebSocket-событие `notification:unread` расширено: `messagesUnread`, `notificationsUnread`, `total`
- [x] `NotificationBell` — иконка с бейджем + дропдаун со списком, переход по клику (внутренние ссылки → navigate, внешние → новое окно)
- [x] Badging API (`navigator.setAppBadge` / `clearAppBadge`) — цифра на иконке PWA при изменении общего счётчика; молча игнорируется на браузерах без поддержки

### 9.3. PWA-инсталл и мобильная адаптация
- [x] Кнопка "Установить" в шапке (только мобильные < 768px)
- [x] Android/Chrome — обработка `beforeinstallprompt`, нативный системный prompt
- [x] iOS Safari — модалка-подсказка с пошаговой инструкцией ("Поделиться → На экран „Домой"")
- [x] Скрытие кнопки в standalone-режиме и после установки (event `appinstalled`)
- [x] "Больше не показывать" сохраняется на 7 дней в localStorage
- [x] Header адаптирован под мобильные: уменьшённые отступы, компактные кнопки
- [x] Финальный мобильный аудит компонентов календаря/уведомлений на ширинах 360/390 px
