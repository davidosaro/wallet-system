export enum TransactionType {
  TRANSFER = 'TRANSFER',
  FUNDING = 'FUNDING',
  INTEREST = 'INTEREST',
  DISBURSEMENT = 'DISBURSEMENT',
}

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
