export interface TransferRequestDto {
  debitAccountNo: string;
  creditAccountNo: string;
  amount: number;
  reference?: string;
  metadata?: Record<string, unknown>;
}

export interface TransferResponse {
  transactionId: string;
  reference: string;
  status: string;
  debitAccount: {
    accountNo: string;
    balanceBefore: number;
    balanceAfter: number;
  };
  creditAccount: {
    accountNo: string;
    balanceBefore: number;
    balanceAfter: number;
  };
  amount: number;
  createdAt: Date;
}
