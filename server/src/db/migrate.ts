import fs from 'fs';
import path from 'path';
import { pool } from './pool';

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function migrate() {
  // Таблица для отслеживания применённых миграций
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `);

  // Получить список уже применённых миграций
  const { rows: applied } = await pool.query('SELECT name FROM _migrations ORDER BY id');
  const appliedNames = new Set(applied.map((r: { name: string }) => r.name));

  // Получить все SQL-файлы миграций
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  let count = 0;

  for (const file of files) {
    if (appliedNames.has(file)) {
      console.log(`  skip: ${file} (already applied)`);
      continue;
    }

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');

    console.log(`  applying: ${file}...`);
    await pool.query(sql);
    await pool.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
    console.log(`  done: ${file}`);
    count++;
  }

  if (count === 0) {
    console.log('No new migrations to apply.');
  } else {
    console.log(`Applied ${count} migration(s).`);
  }
}

migrate()
  .then(() => {
    console.log('Migration complete.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
