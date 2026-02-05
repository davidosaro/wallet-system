import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import {
  LedgerEntryAttributes,
  CreateLedgerEntryDto,
  EntryType,
} from '../types/ledgerEntry';

export const LedgerEntry = sequelize.define<
  Model<LedgerEntryAttributes, CreateLedgerEntryDto>
>(
  'LedgerEntry',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    transactionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'transaction_id',
    },
    accountNo: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: 'account_no',
    },
    entryType: {
      type: DataTypes.ENUM(...Object.values(EntryType)),
      allowNull: false,
      field: 'entry_type',
    },
    amount: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      validate: {
        min: 0.0001,
      },
    },
    balanceBefore: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      field: 'balance_before',
    },
    balanceAfter: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      field: 'balance_after',
    },
  },
  {
    tableName: 'ledger_entries',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);
