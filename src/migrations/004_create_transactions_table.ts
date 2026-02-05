import { QueryInterface, DataTypes } from 'sequelize';
import { tableExists, createIndexIfNotExists } from './helpers';

export async function up(queryInterface: QueryInterface) {
  if (await tableExists(queryInterface, 'transactions')) {
    console.log('Table transactions already exists, skipping...');
    return;
  }

  await queryInterface.createTable('transactions', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    idempotency_key: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    transaction_type: {
      type: DataTypes.ENUM('TRANSFER', 'FUNDING', 'INTEREST'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    reference: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    error_message: {
      type: DataTypes.TEXT,
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

  await createIndexIfNotExists(queryInterface, 'transactions', ['idempotency_key']);
  await createIndexIfNotExists(queryInterface, 'transactions', ['status']);
  await createIndexIfNotExists(queryInterface, 'transactions', ['transaction_type']);
  await createIndexIfNotExists(queryInterface, 'transactions', ['created_at']);
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.dropTable('transactions');
}
