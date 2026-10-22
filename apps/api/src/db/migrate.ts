import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './index';

export async function runMigrations(): Promise<void> {
  console.log('[Migration] Running database migrations...');
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('[Migration] Migrations applied successfully!');
  } catch (error) {
    console.error('[Migration] Error applying migrations:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations().catch(() => {
    process.exit(1);
  });
}
