// Transaction type string literals
export type TransactionType = 'TRANSFER' | 'FUNDING' | 'INTEREST' | 'DISBURSEMENT';

// Transaction type constants for convenience
export const TransactionType = {
  TRANSFER: 'TRANSFER' as TransactionType,
  FUNDING: 'FUNDING' as TransactionType,
  INTEREST: 'INTEREST' as TransactionType,
  DISBURSEMENT: 'DISBURSEMENT' as TransactionType,
};

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface TransactionAttributes {
  id: string;
  idempotencyKey?: string | null;
  transactionType: TransactionType;
  status: TransactionStatus;
  reference: string;
  debitAccountNo?: string | null;
  creditAccountNo?: string | null;
  amount?: number | null;
  debitBalanceBefore?: number | null;
  debitBalanceAfter?: number | null;
  creditBalanceBefore?: number | null;
  creditBalanceAfter?: number | null;
  metadata?: Record<string, unknown> | null;
  errorMessage?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateTransactionDto {
  idempotencyKey?: string | null;
  transactionType: TransactionType;
  status?: TransactionStatus;
  reference: string;
  debitAccountNo?: string | null;
  creditAccountNo?: string | null;
  amount?: number | null;
  debitBalanceBefore?: number | null;
  debitBalanceAfter?: number | null;
  creditBalanceBefore?: number | null;
  creditBalanceAfter?: number | null;
  metadata?: Record<string, unknown> | null;
}
