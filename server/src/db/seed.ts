import bcrypt from 'bcrypt';
import { pool } from './pool';

async function seed() {
  // =====================
  // 1. Seed вкладок (11 штук)
  // =====================
  const tabs = [
    { slug: 'beseda', name: 'Беседа', sort_order: 1 },
    { slug: 'lectures', name: 'Лекции', sort_order: 2 },
    { slug: 'instructions', name: 'Инструкции', sort_order: 3 },
    { slug: 'podcasts', name: 'Подкасты', sort_order: 4 },
    { slug: 'books', name: 'Книги', sort_order: 5 },
    { slug: 'films', name: 'Фильмы', sort_order: 6 },
    { slug: 'program-360', name: 'Программа Руководитель 360', sort_order: 7 },
    { slug: 'marathons', name: 'Марафоны', sort_order: 8 },
    { slug: 'personal-chat', name: 'Личная беседа', sort_order: 9 },
    { slug: 'dtp', name: 'ДТП', sort_order: 10 },
    { slug: 'call-tracker', name: 'Трекер созвонов', sort_order: 11 },
  ];

  for (const tab of tabs) {
    await pool.query(
      `INSERT INTO tabs (slug, name, sort_order) VALUES ($1, $2, $3)
       ON CONFLICT (slug) DO NOTHING`,
      [tab.slug, tab.name, tab.sort_order]
    );
  }
  console.log('  Tabs seeded (11)');

  // =====================
  // 2. Seed подкатегорий
  // =====================
  const categories: { tab_slug: string; items: { name: string; slug: string }[] }[] = [
    {
      tab_slug: 'lectures',
      items: [
        { name: 'Бухгалтерия', slug: 'accounting' },
        { name: 'Бизнес-процессы', slug: 'business-processes' },
        { name: 'Маркетинг', slug: 'marketing' },
        { name: 'Найм', slug: 'hiring' },
        { name: 'Руководитель', slug: 'manager' },
        { name: 'Учет', slug: 'bookkeeping' },
        { name: 'Продажи', slug: 'sales' },
        { name: 'Команда', slug: 'team' },
        { name: 'Мышление', slug: 'mindset' },
      ],
    },
    {
      tab_slug: 'instructions',
      items: [
        { name: 'Команда', slug: 'team' },
        { name: 'Маркетинг', slug: 'marketing' },
        { name: 'Продажи', slug: 'sales' },
        { name: 'Учёт', slug: 'bookkeeping' },
        { name: 'Руководитель', slug: 'manager' },
        { name: 'Открытие', slug: 'opening' },
        { name: 'Работа центра', slug: 'center-work' },
        { name: 'Технические вопросы', slug: 'tech' },
      ],
    },
    {
      tab_slug: 'program-360',
      items: [
        { name: 'Блок 1. Старт сезона (маркетинг+добор)', slug: 'block-1-start' },
        { name: 'Блок 2. Продажи 1', slug: 'block-2-sales-1' },
        { name: 'Блок 3. Клиенты — сервис и взаимодействие', slug: 'block-3-clients' },
        { name: 'Блок 4. Команда', slug: 'block-4-team' },
        { name: 'Блок 5. Структура', slug: 'block-5-structure' },
        { name: 'Блок 6. Продажи 2', slug: 'block-6-sales-2' },
      ],
    },
    {
      tab_slug: 'marathons',
      items: [
        { name: 'Бизнес-процессы', slug: 'business-processes' },
        { name: 'Администратор', slug: 'administrator' },
        { name: 'Команда', slug: 'team' },
        { name: 'Найм', slug: 'hiring' },
        { name: 'Супер-ассистент', slug: 'super-assistant' },
        { name: 'Привлечение клиентов', slug: 'client-acquisition' },
      ],
    },
  ];

  for (const group of categories) {
    const { rows } = await pool.query('SELECT id FROM tabs WHERE slug = $1', [group.tab_slug]);
    if (rows.length === 0) {
      console.warn(`  Tab "${group.tab_slug}" not found, skipping categories`);
      continue;
    }
    const tabId = rows[0].id;

    for (let i = 0; i < group.items.length; i++) {
      const item = group.items[i];
      await pool.query(
        `INSERT INTO categories (tab_id, name, slug, sort_order) VALUES ($1, $2, $3, $4)
         ON CONFLICT (tab_id, slug) DO NOTHING`,
        [tabId, item.name, item.slug, i + 1]
      );
    }
    console.log(`  Categories seeded for "${group.tab_slug}" (${group.items.length})`);
  }

  // =====================
  // 3. Суперадмин-аккаунт
  // =====================
  const superadminLogin = 'superadmin';
  const superadminPassword = 'admin123'; // Сменить после первого входа!
  const passwordHash = await bcrypt.hash(superadminPassword, 10);

  await pool.query(
    `INSERT INTO users (first_name, last_name, login, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (login) DO NOTHING`,
    ['Super', 'Admin', superadminLogin, passwordHash, 'superadmin']
  );
  console.log(`  Superadmin seeded (login: ${superadminLogin}, password: ${superadminPassword})`);
}

seed()
  .then(() => {
    console.log('Seed complete.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
