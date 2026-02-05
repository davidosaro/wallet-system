import { QueryInterface, DataTypes } from 'sequelize';
import { tableExists, createIndexIfNotExists } from './helpers';

export async function up(queryInterface: QueryInterface) {
  if (await tableExists(queryInterface, 'loans')) {
    console.log('Table loans already exists, skipping...');
    return;
  }

  await queryInterface.createTable('loans', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    loan_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    account_no: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: 'Account that received the loan',
    },
    principal_amount: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      comment: 'Original loan amount',
    },
    outstanding_principal: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      comment: 'Remaining principal to be repaid',
    },
    interest_rate: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
      comment: 'Annual interest rate (e.g., 0.275 for 27.5%)',
    },
    accrued_interest: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      comment: 'Total interest accrued so far',
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'ACTIVE', 'PAID_OFF', 'DEFAULTED'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    disbursement_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date when loan was disbursed',
    },
    last_accrual_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Last date interest was accrued',
    },
    maturity_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Expected repayment date',
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'NGN',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  await createIndexIfNotExists(queryInterface, 'loans', ['loan_number']);
  await createIndexIfNotExists(queryInterface, 'loans', ['account_no']);
  await createIndexIfNotExists(queryInterface, 'loans', ['status']);
  await createIndexIfNotExists(queryInterface, 'loans', ['disbursement_date']);
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.dropTable('loans');
}
