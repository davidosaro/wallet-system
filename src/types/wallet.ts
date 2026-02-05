export interface WalletAttributes {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  accountNo?: string | null;
  createdAt?: Date;
}

export interface CreateWalletDto {
  userId: string;
  currency?: string;
}

export interface DepositDto {
  amount: number;
}

export interface WithdrawDto {
  amount: number;
}

export interface TransferDto {
  toWalletId: string;
  amount: number;
}
