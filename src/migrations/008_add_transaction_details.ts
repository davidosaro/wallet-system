import { QueryInterface, DataTypes } from 'sequelize';
import { columnExists, createIndexIfNotExists } from './helpers';

export async function up(queryInterface: QueryInterface) {
  // Add debit_account_no
  if (!(await columnExists(queryInterface, 'transactions', 'debit_account_no'))) {
    await queryInterface.addColumn('transactions', 'debit_account_no', {
      type: DataTypes.STRING(30),
      allowNull: true,
    });
  }

  // Add credit_account_no
  if (!(await columnExists(queryInterface, 'transactions', 'credit_account_no'))) {
    await queryInterface.addColumn('transactions', 'credit_account_no', {
      type: DataTypes.STRING(30),
      allowNull: true,
    });
  }

  // Add amount
  if (!(await columnExists(queryInterface, 'transactions', 'amount'))) {
    await queryInterface.addColumn('transactions', 'amount', {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true,
    });
  }

  // Add debit_balance_before
  if (!(await columnExists(queryInterface, 'transactions', 'debit_balance_before'))) {
    await queryInterface.addColumn('transactions', 'debit_balance_before', {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true,
    });
  }

  // Add debit_balance_after
  if (!(await columnExists(queryInterface, 'transactions', 'debit_balance_after'))) {
    await queryInterface.addColumn('transactions', 'debit_balance_after', {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true,
    });
  }

  // Add credit_balance_before
  if (!(await columnExists(queryInterface, 'transactions', 'credit_balance_before'))) {
    await queryInterface.addColumn('transactions', 'credit_balance_before', {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true,
    });
  }

  // Add credit_balance_after
  if (!(await columnExists(queryInterface, 'transactions', 'credit_balance_after'))) {
    await queryInterface.addColumn('transactions', 'credit_balance_after', {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true,
    });
  }

  // Add indexes
  await createIndexIfNotExists(queryInterface, 'transactions', ['debit_account_no']);
  await createIndexIfNotExists(queryInterface, 'transactions', ['credit_account_no']);
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.removeColumn('transactions', 'debit_account_no');
  await queryInterface.removeColumn('transactions', 'credit_account_no');
  await queryInterface.removeColumn('transactions', 'amount');
  await queryInterface.removeColumn('transactions', 'debit_balance_before');
  await queryInterface.removeColumn('transactions', 'debit_balance_after');
  await queryInterface.removeColumn('transactions', 'credit_balance_before');
  await queryInterface.removeColumn('transactions', 'credit_balance_after');
}
