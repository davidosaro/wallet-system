export enum AccountType {
  USER_WALLET = 'USER_WALLET',
  POOL = 'POOL',
  INTEREST_EXPENSE = 'INTEREST_EXPENSE',
}

export interface AccountAttributes {
  id: string;
  accountType: AccountType;
  accountName: string;
  accountNo: string;
  balance: number;
  clearedBalance: number;
  currency: string;
  walletId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateAccountDto {
  accountType: AccountType;
  accountName: string;
  currency?: string;
  walletId?: string | null;
}

export interface CreatePoolAccountDto {
  accountName: string;
  currency?: string;
}
