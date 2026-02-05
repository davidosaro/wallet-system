import { sequelize } from '../config/database';
import * as createUsersTable from './001_create_users_table';
import * as createWalletsTable from './002_create_wallets_table';
import * as createAccountsTable from './003_create_accounts_table';
import * as createTransactionsTable from './004_create_transactions_table';
import * as createLedgerEntriesTable from './005_create_ledger_entries_table';
import * as addAccountNoToWallets from './006_add_account_no_to_wallets';
import * as changeLedgerAccountIdToAccountNo from './007_change_ledger_account_id_to_account_no';

const migrations = [
  createUsersTable,
  createWalletsTable,
  createAccountsTable,
  createTransactionsTable,
  createLedgerEntriesTable,
  addAccountNoToWallets,
  changeLedgerAccountIdToAccountNo,
];

export async function runMigrations() {
  for (const migration of migrations) {
    console.log(`Running migration: ${migration.up.name}`);
    await migration.up(sequelize.getQueryInterface());
  }
  console.log('All migrations completed');
}

export async function rollbackMigrations() {
  for (const migration of [...migrations].reverse()) {
    console.log(`Rolling back migration: ${migration.down.name}`);
    await migration.down(sequelize.getQueryInterface());
  }
  console.log('All rollbacks completed');
}
