import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import postgres from 'postgres';

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = postgres(databaseUrl, { max: 1 });

  try {
    // Create migrations tracking table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;

    // Read migration files
    const migrationsDir = resolve(__dirname, 'migrations');
    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    // Get already applied migrations
    const applied = await sql`SELECT name FROM _migrations ORDER BY name`;
    const appliedSet = new Set(applied.map((row) => row.name));

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`Skipping already applied: ${file}`);
        continue;
      }

      console.log(`Applying migration: ${file}`);
      const content = readFileSync(resolve(migrationsDir, file), 'utf8');
      await sql.begin(async (tx) => {
        await tx.unsafe(content);
        await tx`INSERT INTO _migrations (name) VALUES (${file})`;
      });
      console.log(`Applied: ${file}`);
    }

    console.log('All migrations applied successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();
