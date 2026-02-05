import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import {
  TransactionAttributes,
  CreateTransactionDto,
  TransactionType,
  TransactionStatus,
} from '../types/transaction';

export const Transaction = sequelize.define<
  Model<TransactionAttributes, CreateTransactionDto>
>(
  'Transaction',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    idempotencyKey: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      field: 'idempotency_key',
    },
    transactionType: {
      type: DataTypes.ENUM(...Object.values(TransactionType)),
      allowNull: false,
      field: 'transaction_type',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(TransactionStatus)),
      allowNull: false,
      defaultValue: TransactionStatus.PENDING,
    },
    reference: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    debitAccountNo: {
      type: DataTypes.STRING(30),
      allowNull: true,
      field: 'debit_account_no',
    },
    creditAccountNo: {
      type: DataTypes.STRING(30),
      allowNull: true,
      field: 'credit_account_no',
    },
    amount: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true,
    },
    debitBalanceBefore: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true,
      field: 'debit_balance_before',
    },
    debitBalanceAfter: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true,
      field: 'debit_balance_after',
    },
    creditBalanceBefore: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true,
      field: 'credit_balance_before',
    },
    creditBalanceAfter: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true,
      field: 'credit_balance_after',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'error_message',
    },
  },
  {
    tableName: 'transactions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);
