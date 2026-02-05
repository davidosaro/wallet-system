import { walletRepository } from '../repositories/walletRepository';
import { accountService } from './accountService';
import { CreateWalletDto } from '../types/wallet';

export const walletService = {
  getAll() {
    return walletRepository.findAll();
  },

  getById(id: string) {
    return walletRepository.findById(id);
  },

  getByUserId(userId: string) {
    return walletRepository.findByUserId(userId);
  },

  async create(data: CreateWalletDto) {
    const wallet = await walletRepository.create(data);
    const walletId = wallet.get('id') as string;
    const currency = wallet.get('currency') as string;

    await accountService.createWalletAccount(
      walletId,
      currency,
      `Wallet Account - ${walletId.slice(0, 8)}`
    );

    return wallet;
  },

  async deposit(id: string, amount: number) {
    const wallet = await walletRepository.findById(id);
    if (!wallet) return null;

    const currentBalance = parseFloat(wallet.get('balance') as string);
    const newBalance = currentBalance + amount;

    return walletRepository.updateBalance(id, newBalance);
  },

  async withdraw(id: string, amount: number) {
    const wallet = await walletRepository.findById(id);
    if (!wallet) return null;

    const currentBalance = parseFloat(wallet.get('balance') as string);
    if (currentBalance < amount) {
      throw new Error('Insufficient balance');
    }

    const newBalance = currentBalance - amount;
    return walletRepository.updateBalance(id, newBalance);
  },

  async transfer(fromId: string, toId: string, amount: number) {
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

    return { fromWallet: await walletRepository.findById(fromId), toWallet: await walletRepository.findById(toId) };
  },

  delete(id: string) {
    return walletRepository.delete(id);
  },
};
