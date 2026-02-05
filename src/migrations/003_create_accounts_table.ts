import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await queryInterface.createTable('accounts', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    account_type: {
      type: DataTypes.ENUM('USER_WALLET', 'POOL', 'INTEREST_EXPENSE'),
      allowNull: false,
    },
    account_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    account_no: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
    balance: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
    },
    cleared_balance: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'NGN',
    },
    wallet_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'wallets',
        key: 'id',
      },
      onDelete: 'CASCADE',
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

  await queryInterface.addIndex('accounts', ['account_type']);
  await queryInterface.addIndex('accounts', ['wallet_id']);
  await queryInterface.addIndex('accounts', ['currency']);
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.dropTable('accounts');
}
