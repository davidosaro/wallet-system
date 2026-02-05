import { accountRepository } from '../repositories/accountRepository';
import {
  AccountType,
  CreateAccountDto,
  CreatePoolAccountDto,
} from '../types/account';

const ACCOUNT_PREFIXES: Record<AccountType, string> = {
  [AccountType.USER_WALLET]: 'WAL',
  [AccountType.POOL]: 'POL',
  [AccountType.INTEREST_EXPENSE]: 'IEX',
};

export const accountService = {
  getAll() {
    return accountRepository.findAll();
  },

  getById(id: string) {
    return accountRepository.findById(id);
  },

  getByAccountNo(accountNo: string) {
    return accountRepository.findByAccountNo(accountNo);
  },

  getByWalletId(walletId: string) {
    return accountRepository.findByWalletId(walletId);
  },

  getByType(accountType: AccountType) {
    return accountRepository.findByType(accountType);
  },

  async generateAccountNumber(
    accountType: AccountType,
    currency: string
  ): Promise<string> {
    const prefix = ACCOUNT_PREFIXES[accountType];
    const count = await accountRepository.countByType(accountType);
    const sequence = (count + 1).toString().padStart(7, '0');
    return `${prefix}${currency}${sequence}`;
  },

  async create(data: CreateAccountDto) {
    const currency = data.currency || 'NGN';
    const accountNo = await this.generateAccountNumber(
      data.accountType,
      currency
    );

    return accountRepository.create({
      accountType: data.accountType,
      accountName: data.accountName,
      accountNo,
      currency,
      walletId: data.walletId || null,
    });
  },

  async createPoolAccount(data: CreatePoolAccountDto) {
    return this.create({
      accountType: AccountType.POOL,
      accountName: data.accountName,
      currency: data.currency,
      walletId: null,
    });
  },

  async createWalletAccount(
    walletId: string,
    currency: string,
    accountName: string
  ) {
    return this.create({
      accountType: AccountType.USER_WALLET,
      accountName,
      currency,
      walletId,
    });
  },

  async updateBalance(id: string, balance: number, clearedBalance?: number) {
    const account = await accountRepository.findById(id);
    if (!account) return null;
    return accountRepository.updateBalance(id, balance, clearedBalance);
  },

  delete(id: string) {
    return accountRepository.delete(id);
  },
};
