import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { WalletAttributes, CreateWalletDto } from '../types/wallet';

export const Wallet = sequelize.define<Model<WalletAttributes, CreateWalletDto>>(
  'Wallet',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    balance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
    },
  },
  {
    tableName: 'wallets',
    updatedAt: false,
  }
);
