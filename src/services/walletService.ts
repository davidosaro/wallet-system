import { walletRepository } from '../repositories/walletRepository';
import { accountRepository } from '../repositories/accountRepository';
import { accountService } from './accountService';
import { CreateWalletDto } from '../types/wallet';

export class WalletError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'WalletError';
  }
}

export interface WalletWithAccountBalance {
  id: string;
  userId: string;
  currency: string;
  accountNo: string | null;
  balance: number;
  clearedBalance: number;
  createdAt: Date;
}

export const walletService = {
  getAll() {
    return walletRepository.findAll();
  },

  getById(id: string) {
    return walletRepository.findById(id);
  },

  /**
   * Get wallet with balance from the associated account (source of truth)
   */
  async getByIdWithAccountBalance(id: string): Promise<WalletWithAccountBalance | null> {
    const wallet = await walletRepository.findById(id);
    if (!wallet) return null;

    const accountNo = wallet.get('accountNo') as string | null;
    if (!accountNo) {
      // No account linked, return wallet balance
      return {
        id: wallet.get('id') as string,
        userId: wallet.get('userId') as string,
        currency: wallet.get('currency') as string,
        accountNo: null,
        balance: parseFloat(wallet.get('balance') as string),
        clearedBalance: parseFloat(wallet.get('balance') as string),
        createdAt: wallet.get('createdAt') as Date,
      };
    }

    // Get balance from account (source of truth)
    const account = await accountRepository.findByAccountNo(accountNo);
    if (!account) {
      // Account not found, return wallet balance
      return {
        id: wallet.get('id') as string,
        userId: wallet.get('userId') as string,
        currency: wallet.get('currency') as string,
        accountNo,
        balance: parseFloat(wallet.get('balance') as string),
        clearedBalance: parseFloat(wallet.get('balance') as string),
        createdAt: wallet.get('createdAt') as Date,
      };
    }

    return {
      id: wallet.get('id') as string,
      userId: wallet.get('userId') as string,
      currency: wallet.get('currency') as string,
      accountNo,
      balance: parseFloat(account.get('balance') as string),
      clearedBalance: parseFloat(account.get('clearedBalance') as string),
      createdAt: wallet.get('createdAt') as Date,
    };
  },

  getByUserId(userId: string) {
    return walletRepository.findByUserId(userId);
  },

  /**
   * Get wallet by user ID with balance from the associated account (source of truth)
   */
  async getByUserIdWithAccountBalance(userId: string): Promise<WalletWithAccountBalance | null> {
    const wallet = await walletRepository.findByUserId(userId);
    if (!wallet) return null;

    const walletId = wallet.get('id') as string;
    return this.getByIdWithAccountBalance(walletId);
  },

  async create(data: CreateWalletDto) {
    const { userId, currency = 'NGN' } = data;

    // Check if user already has a wallet in this currency
    const existingWallet = await walletRepository.findByUserIdAndCurrency(
      userId,
      currency
    );

    if (existingWallet) {
      throw new WalletError(
        `User already has a wallet in ${currency}`,
        'WALLET_ALREADY_EXISTS'
      );
    }

    const wallet = await walletRepository.create(data);
    const walletId = wallet.get('id') as string;
    const walletCurrency = wallet.get('currency') as string;

    const account = await accountService.createWalletAccount(
      walletId,
      walletCurrency,
      `Wallet Account - ${walletId.slice(0, 8)}`
    );

    const accountNo = account.get('accountNo') as string;
    await walletRepository.updateAccountNo(walletId, accountNo);

    return walletRepository.findById(walletId);
  },

  delete(id: string) {
    return walletRepository.delete(id);
  },
};
