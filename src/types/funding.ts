export interface FundAccountDto {
  accountNo: string;
  amount: number;
  sourceAccountNo: string;
  reference?: string;
  metadata?: Record<string, unknown>;
}

export interface FundWalletDto {
  walletId: string;
  amount: number;
  sourceAccountNo: string;
  reference?: string;
  metadata?: Record<string, unknown>;
}

export interface FundingResponse {
  transactionId: string;
  reference: string;
  status: string;
  sourceAccount: {
    accountNo: string;
    balanceBefore: number;
    balanceAfter: number;
  };
  destinationAccount: {
    accountNo: string;
    balanceBefore: number;
    balanceAfter: number;
  };
  amount: number;
  createdAt: Date;
}
