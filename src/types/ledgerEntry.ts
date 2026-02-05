export enum EntryType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export interface LedgerEntryAttributes {
  id: string;
  transactionId: string;
  accountNo: string;
  entryType: EntryType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  createdAt?: Date;
}

export interface CreateLedgerEntryDto {
  transactionId: string;
  accountNo: string;
  entryType: EntryType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
}
