import { QueryInterface, DataTypes } from 'sequelize';
import { tableExists, createIndexIfNotExists } from './helpers';

export async function up(queryInterface: QueryInterface) {
  if (await tableExists(queryInterface, 'daily_interest_accruals')) {
    console.log('Table daily_interest_accruals already exists, skipping...');
    return;
  }

  await queryInterface.createTable('daily_interest_accruals', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    loan_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'loans',
        key: 'id',
      },
      onDelete: 'RESTRICT',
    },
    accrual_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Date for which interest is being accrued',
    },
    principal_balance: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      comment: 'Outstanding principal on this date',
    },
    daily_rate: {
      type: DataTypes.DECIMAL(15, 12),
      allowNull: false,
      comment: 'Daily interest rate used for calculation',
    },
    interest_amount: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      comment: 'Interest accrued for this day',
    },
    days_in_year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '365 or 366 for leap years',
    },
    cumulative_interest: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      comment: 'Total interest accrued up to this date',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  await createIndexIfNotExists(queryInterface, 'daily_interest_accruals', ['loan_id']);
  await createIndexIfNotExists(queryInterface, 'daily_interest_accruals', ['accrual_date']);
  await createIndexIfNotExists(queryInterface, 'daily_interest_accruals', [
    'loan_id',
    'accrual_date',
  ]);

  // Add unique constraint to prevent duplicate accruals for same loan on same date
  await queryInterface.sequelize.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'daily_interest_accruals_loan_date_unique'
      ) THEN
        ALTER TABLE daily_interest_accruals
        ADD CONSTRAINT daily_interest_accruals_loan_date_unique
        UNIQUE (loan_id, accrual_date);
      END IF;
    END $$;
  `);
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.dropTable('daily_interest_accruals');
}
