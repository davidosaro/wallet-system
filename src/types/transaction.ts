export enum TransactionType {
  TRANSFER = 'TRANSFER',
  FUNDING = 'FUNDING',
  INTEREST = 'INTEREST',
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
  metadata?: Record<string, unknown> | null;
}
