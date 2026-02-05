import { Transaction } from 'sequelize';
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

  async findById(id: string, transaction?: Transaction) {
    return Account.findByPk(id, { transaction });
  },

  async findByIdWithLock(id: string, transaction: Transaction) {
    return Account.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
  },

  async findByAccountNo(accountNo: string, transaction?: Transaction) {
    return Account.findOne({ where: { accountNo }, transaction });
  },

  async findByAccountNoWithLock(accountNo: string, transaction: Transaction) {
    return Account.findOne({
      where: { accountNo },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
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

  async updateBalance(
    id: string,
    balance: number,
    clearedBalance?: number,
    transaction?: Transaction
  ) {
    const account = await Account.findByPk(id, { transaction });
    if (!account) return null;
    const updateData: { balance: number; clearedBalance?: number } = { balance };
    if (clearedBalance !== undefined) {
      updateData.clearedBalance = clearedBalance;
    }
    return account.update(updateData, { transaction });
  },

  async updateBalanceByAccountNo(
    accountNo: string,
    balance: number,
    clearedBalance?: number,
    transaction?: Transaction
  ) {
    const account = await Account.findOne({ where: { accountNo }, transaction });
    if (!account) return null;
    const updateData: { balance: number; clearedBalance?: number } = { balance };
    if (clearedBalance !== undefined) {
      updateData.clearedBalance = clearedBalance;
    }
    return account.update(updateData, { transaction });
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
