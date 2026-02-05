import { Wallet } from '../models/Wallet';
import { CreateWalletDto } from '../types/wallet';

export const walletRepository = {
  async findAll() {
    return Wallet.findAll({ order: [['createdAt', 'ASC']] });
  },

  async findById(id: string) {
    return Wallet.findByPk(id);
  },

  async findByUserId(userId: string) {
    return Wallet.findOne({ where: { userId } });
  },

  async create(data: CreateWalletDto) {
    return Wallet.create(data);
  },

  async updateBalance(id: string, balance: number) {
    const wallet = await Wallet.findByPk(id);
    if (!wallet) return null;
    return wallet.update({ balance });
  },

  async delete(id: string) {
    const deleted = await Wallet.destroy({ where: { id } });
    return deleted > 0;
  },
};
