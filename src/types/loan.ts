export enum LoanStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  PAID_OFF = 'PAID_OFF',
  DEFAULTED = 'DEFAULTED',
}

export interface LoanAttributes {
  id: string;
  loanNumber: string;
  accountNo: string;
  principalAmount: number;
  outstandingPrincipal: number;
  interestRate: number;
  accruedInterest: number;
  status: LoanStatus;
  disbursementDate?: Date | null;
  lastAccrualDate?: Date | null;
  maturityDate?: Date | null;
  currency: string;
  metadata?: Record<string, unknown> | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateLoanDto {
  accountNo: string;
  principalAmount: number;
  interestRate?: number; // Defaults to 0.275 (27.5%)
  maturityDate?: Date;
  currency?: string;
  metadata?: Record<string, unknown>;
}

export interface DisburseLoanDto {
  loanId: string;
  sourceAccountNo: string; // Pool account that funds the loan
  disbursementDate?: Date;
}

export interface LoanResponse {
  id: string;
  loanNumber: string;
  accountNo: string;
  principalAmount: number;
  outstandingPrincipal: number;
  interestRate: number;
  accruedInterest: number;
  status: string;
  disbursementDate?: Date;
  lastAccrualDate?: Date;
  maturityDate?: Date;
  currency: string;
  createdAt: Date;
}
