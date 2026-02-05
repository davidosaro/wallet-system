import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Convert transaction_type from ENUM to VARCHAR(50)
 * This allows for more flexible transaction type values without schema changes
 */
export async function up(queryInterface: QueryInterface) {
  console.log('Converting transaction_type from ENUM to VARCHAR...');

  // PostgreSQL: Convert ENUM to VARCHAR using USING clause
  await queryInterface.sequelize.query(`
    ALTER TABLE transactions
    ALTER COLUMN transaction_type TYPE VARCHAR(50)
    USING transaction_type::text;
  `);

  console.log('Successfully converted transaction_type to VARCHAR(50)');
}

export async function down(queryInterface: QueryInterface) {
  console.log('Converting transaction_type back to ENUM...');

  // Convert back to ENUM
  await queryInterface.sequelize.query(`
    ALTER TABLE transactions
    ALTER COLUMN transaction_type TYPE VARCHAR(50);
  `);

  // Recreate the ENUM type
  await queryInterface.sequelize.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_transactions_transaction_type') THEN
        CREATE TYPE enum_transactions_transaction_type AS ENUM ('TRANSFER', 'FUNDING', 'INTEREST', 'DISBURSEMENT');
      END IF;
    END $$;
  `);

  // Convert column back to ENUM
  await queryInterface.sequelize.query(`
    ALTER TABLE transactions
    ALTER COLUMN transaction_type TYPE enum_transactions_transaction_type
    USING transaction_type::enum_transactions_transaction_type;
  `);

  console.log('Successfully reverted transaction_type to ENUM');
}
