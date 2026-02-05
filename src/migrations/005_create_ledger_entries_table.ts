import { QueryInterface, DataTypes } from 'sequelize';
import { tableExists, createIndexIfNotExists } from './helpers';

export async function up(queryInterface: QueryInterface) {
  if (await tableExists(queryInterface, 'ledger_entries')) {
    console.log('Table ledger_entries already exists, skipping...');
    return;
  }

  await queryInterface.createTable('ledger_entries', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    transaction_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'transactions',
        key: 'id',
      },
      onDelete: 'RESTRICT',
    },
    account_no: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    entry_type: {
      type: DataTypes.ENUM('DEBIT', 'CREDIT'),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
    },
    balance_before: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
    },
    balance_after: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  await createIndexIfNotExists(queryInterface, 'ledger_entries', ['transaction_id']);
  await createIndexIfNotExists(queryInterface, 'ledger_entries', ['account_no']);
  await createIndexIfNotExists(queryInterface, 'ledger_entries', ['entry_type']);
  await createIndexIfNotExists(queryInterface, 'ledger_entries', ['created_at']);

  // Add check constraint for positive amount (idempotent)
  await queryInterface.sequelize.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ledger_entries_amount_positive'
      ) THEN
        ALTER TABLE ledger_entries
        ADD CONSTRAINT ledger_entries_amount_positive
        CHECK (amount > 0);
      END IF;
    END $$;
  `);
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.dropTable('ledger_entries');
}
