import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { AccountAttributes, CreateAccountDto, AccountType } from '../types/account';

export const Account = sequelize.define<Model<AccountAttributes, CreateAccountDto>>(
  'Account',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    accountType: {
      type: DataTypes.ENUM(...Object.values(AccountType)),
      allowNull: false,
      field: 'account_type',
    },
    accountName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'account_name',
    },
    accountNo: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
      field: 'account_no',
    },
    balance: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
    },
    clearedBalance: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'cleared_balance',
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'NGN',
    },
    walletId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'wallet_id',
    },
  },
  {
    tableName: 'accounts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);
