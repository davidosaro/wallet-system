import { QueryInterface, DataTypes } from 'sequelize';
import { columnExists, createIndexIfNotExists } from './helpers';

export async function up(queryInterface: QueryInterface) {
  // Check if account_id column exists (meaning migration hasn't run)
  const hasAccountId = await columnExists(queryInterface, 'ledger_entries', 'account_id');
  const hasAccountNo = await columnExists(queryInterface, 'ledger_entries', 'account_no');

  if (!hasAccountId && hasAccountNo) {
    console.log('Migration already applied (account_no exists, account_id removed), skipping...');
    return;
  }

  if (hasAccountId) {
    // Remove the old account_id column and foreign key
    await queryInterface.removeColumn('ledger_entries', 'account_id');
  }

  if (!hasAccountNo) {
    // Add the new account_no column
    await queryInterface.addColumn('ledger_entries', 'account_no', {
      type: DataTypes.STRING(30),
      allowNull: false,
    });
  }

  // Add index on account_no (idempotent)
  await createIndexIfNotExists(queryInterface, 'ledger_entries', ['account_no']);
}

export async function down(queryInterface: QueryInterface) {
  const hasAccountNo = await columnExists(queryInterface, 'ledger_entries', 'account_no');
  const hasAccountId = await columnExists(queryInterface, 'ledger_entries', 'account_id');

  if (hasAccountNo) {
    // Remove account_no column
    await queryInterface.removeColumn('ledger_entries', 'account_no');
  }

  if (!hasAccountId) {
    // Add back account_id column
    await queryInterface.addColumn('ledger_entries', 'account_id', {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'accounts',
        key: 'id',
      },
      onDelete: 'RESTRICT',
    });

    await createIndexIfNotExists(queryInterface, 'ledger_entries', ['account_id']);
  }
}
