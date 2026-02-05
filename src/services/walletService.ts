import { walletRepository } from '../repositories/walletRepository';
import { accountRepository } from '../repositories/accountRepository';
import { accountService } from './accountService';
import { CreateWalletDto } from '../types/wallet';

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
    const wallet = await walletRepository.create(data);
    const walletId = wallet.get('id') as string;
    const currency = wallet.get('currency') as string;

    const account = await accountService.createWalletAccount(
      walletId,
      currency,
      `Wallet Account - ${walletId.slice(0, 8)}`
    );

    const accountNo = account.get('accountNo') as string;
    await walletRepository.updateAccountNo(walletId, accountNo);

    return walletRepository.findById(walletId);
  },

  /**
   * @deprecated Use fundingService.fundWallet() instead for proper accounting
   * This method only updates the wallet table and does NOT create ledger entries
   */
  async deposit(id: string, amount: number) {
    console.warn(
      'DEPRECATED: walletService.deposit() does not create ledger entries. Use fundingService.fundWallet() instead.'
    );
    const wallet = await walletRepository.findById(id);
    if (!wallet) return null;

    const currentBalance = parseFloat(wallet.get('balance') as string);
    const newBalance = currentBalance + amount;

    return walletRepository.updateBalance(id, newBalance);
  },

  /**
   * @deprecated Use transferService.transfer() instead for proper accounting
   * This method only updates the wallet table and does NOT create ledger entries
   */
  async withdraw(id: string, amount: number) {
    console.warn(
      'DEPRECATED: walletService.withdraw() does not create ledger entries. Use transferService.transfer() instead.'
    );
    const wallet = await walletRepository.findById(id);
    if (!wallet) return null;

    const currentBalance = parseFloat(wallet.get('balance') as string);
    if (currentBalance < amount) {
      throw new Error('Insufficient balance');
    }

    const newBalance = currentBalance - amount;
    return walletRepository.updateBalance(id, newBalance);
  },

  /**
   * @deprecated Use transferService.transfer() instead for proper accounting
   * This method only updates wallet tables and does NOT create ledger entries
   */
  async transfer(fromId: string, toId: string, amount: number) {
    console.warn(
      'DEPRECATED: walletService.transfer() does not create ledger entries. Use transferService.transfer() instead.'
    );
    const fromWallet = await walletRepository.findById(fromId);
    const toWallet = await walletRepository.findById(toId);

    if (!fromWallet || !toWallet) {
      throw new Error('Wallet not found');
    }

    const fromBalance = parseFloat(fromWallet.get('balance') as string);
    if (fromBalance < amount) {
      throw new Error('Insufficient balance');
    }

    const toBalance = parseFloat(toWallet.get('balance') as string);

    await walletRepository.updateBalance(fromId, fromBalance - amount);
    await walletRepository.updateBalance(toId, toBalance + amount);

    return {
      fromWallet: await walletRepository.findById(fromId),
      toWallet: await walletRepository.findById(toId),
    };
  },

  delete(id: string) {
    return walletRepository.delete(id);
  },
};
