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
    { slug: 'program-360', name: 'Руководитель 360', sort_order: 7 },
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
  type CategoryItem = { name: string; slug: string; children?: CategoryItem[] };
  const categories: { tab_slug: string; items: CategoryItem[] }[] = [
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
        {
          name: 'Команда', slug: 'team',
          children: [
            { name: 'Найм', slug: 'team-hiring' },
            { name: 'Ассистент', slug: 'team-assistant' },
            { name: 'Команда', slug: 'team-team' },
          ],
        },
        {
          name: 'Маркетинг', slug: 'marketing',
          children: [
            { name: 'Анализ', slug: 'marketing-analysis' },
            { name: 'Социальные сети', slug: 'marketing-social' },
            { name: 'Каналы привлечения', slug: 'marketing-channels' },
          ],
        },
        {
          name: 'Продажи', slug: 'sales',
          children: [
            { name: 'Клиенты', slug: 'sales-clients' },
            { name: 'Менеджер', slug: 'sales-manager' },
          ],
        },
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

    let total = 0;
    for (let i = 0; i < group.items.length; i++) {
      const item = group.items[i];
      const { rows: parentRows } = await pool.query(
        `INSERT INTO categories (tab_id, parent_id, name, slug, sort_order) VALUES ($1, NULL, $2, $3, $4)
         ON CONFLICT (tab_id, slug) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [tabId, item.name, item.slug, i + 1]
      );
      const parentId = parentRows[0].id;
      total++;

      if (item.children) {
        for (let j = 0; j < item.children.length; j++) {
          const child = item.children[j];
          await pool.query(
            `INSERT INTO categories (tab_id, parent_id, name, slug, sort_order) VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (tab_id, slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name`,
            [tabId, parentId, child.name, child.slug, j + 1]
          );
          total++;
        }
      }
    }
    console.log(`  Categories seeded for "${group.tab_slug}" (${total})`);
  }

  // =====================
  // 3. Суперадмин-аккаунт
  // =====================
  const superadminLogin = 'superadmin';
  const superadminPassword = 'admin123'; // Сменить после первого входа!
  const passwordHash = await bcrypt.hash(superadminPassword, 10);

  const { rows: superadminRows } = await pool.query(
    `INSERT INTO users (first_name, last_name, login, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (login) DO UPDATE SET login = EXCLUDED.login
     RETURNING id`,
    ['Super', 'Admin', superadminLogin, passwordHash, 'superadmin']
  );
  const superadminId = superadminRows[0].id;

  // Добавить суперадмина в общую комнату
  await pool.query(
    `INSERT INTO chat_room_members (chat_room_id, user_id)
     VALUES ('00000000-0000-0000-0000-000000000001', $1)
     ON CONFLICT DO NOTHING`,
    [superadminId]
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
