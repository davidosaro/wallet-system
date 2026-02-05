import { QueryInterface, DataTypes } from 'sequelize';
import { columnExists, createIndexIfNotExists } from './helpers';

export async function up(queryInterface: QueryInterface) {
  if (await columnExists(queryInterface, 'wallets', 'account_no')) {
    console.log('Column account_no already exists in wallets, skipping...');
    return;
  }

  await queryInterface.addColumn('wallets', 'account_no', {
    type: DataTypes.STRING(30),
    allowNull: true,
  });

  await createIndexIfNotExists(queryInterface, 'wallets', ['account_no']);
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.removeColumn('wallets', 'account_no');
}
