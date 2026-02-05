import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import {
  DailyInterestAccrualAttributes,
  CreateDailyAccrualDto,
} from '../types/interestAccrual';

export const DailyInterestAccrual = sequelize.define<
  Model<DailyInterestAccrualAttributes, CreateDailyAccrualDto>
>(
  'DailyInterestAccrual',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    loanId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'loan_id',
      references: {
        model: 'loans',
        key: 'id',
      },
    },
    accrualDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'accrual_date',
    },
    principalBalance: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      field: 'principal_balance',
    },
    dailyRate: {
      type: DataTypes.DECIMAL(15, 12),
      allowNull: false,
      field: 'daily_rate',
    },
    interestAmount: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      field: 'interest_amount',
    },
    daysInYear: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'days_in_year',
    },
    cumulativeInterest: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      field: 'cumulative_interest',
    },
  },
  {
    tableName: 'daily_interest_accruals',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);
