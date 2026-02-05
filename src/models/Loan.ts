import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { LoanAttributes, CreateLoanDto, LoanStatus } from '../types/loan';

export const Loan = sequelize.define<Model<LoanAttributes, CreateLoanDto>>(
  'Loan',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    loanNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'loan_number',
    },
    accountNo: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: 'account_no',
    },
    principalAmount: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      field: 'principal_amount',
    },
    outstandingPrincipal: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      field: 'outstanding_principal',
    },
    interestRate: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
      field: 'interest_rate',
    },
    accruedInterest: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'accrued_interest',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(LoanStatus)),
      allowNull: false,
      defaultValue: LoanStatus.PENDING,
    },
    disbursementDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'disbursement_date',
    },
    lastAccrualDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_accrual_date',
    },
    maturityDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'maturity_date',
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
  },
  {
    tableName: 'loans',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);
