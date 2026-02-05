import { Account } from '../models/Account';
import { AccountType } from '../types/account';

interface CreateAccountData {
  accountType: AccountType;
  accountName: string;
  accountNo: string;
  currency: string;
  walletId?: string | null;
}

export const accountRepository = {
  async findAll() {
    return Account.findAll({ order: [['created_at', 'DESC']] });
  },

  async findById(id: string) {
    return Account.findByPk(id);
  },

  async findByAccountNo(accountNo: string) {
    return Account.findOne({ where: { accountNo } });
  },

  async findByWalletId(walletId: string) {
    return Account.findOne({ where: { walletId } });
  },

  async findByType(accountType: AccountType) {
    return Account.findAll({ where: { accountType }, order: [['created_at', 'DESC']] });
  },

  async findByTypeAndCurrency(accountType: AccountType, currency: string) {
    return Account.findAll({ where: { accountType, currency }, order: [['created_at', 'DESC']] });
  },

  async create(data: CreateAccountData) {
    return Account.create(data);
  },

  async updateBalance(id: string, balance: number, clearedBalance?: number) {
    const account = await Account.findByPk(id);
    if (!account) return null;
    const updateData: { balance: number; clearedBalance?: number } = { balance };
    if (clearedBalance !== undefined) {
      updateData.clearedBalance = clearedBalance;
    }
    return account.update(updateData);
  },

  async getLastAccountByType(accountType: AccountType) {
    return Account.findOne({
      where: { accountType },
      order: [['created_at', 'DESC']],
    });
  },

  async countByType(accountType: AccountType) {
    return Account.count({ where: { accountType } });
  },

  async delete(id: string) {
    const deleted = await Account.destroy({ where: { id } });
    return deleted > 0;
  },
};
