import 'dotenv/config';
import { sequelize } from './config/database';
import { runMigrations, rollbackMigrations } from './migrations';

const command = process.argv[2];

async function main() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    if (command === 'up') {
      await runMigrations();
    } else if (command === 'down') {
      await rollbackMigrations();
    } else {
      console.log('Usage: ts-node src/migrate.ts [up|down]');
    }
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sequelize.close();
  }
}

main();
