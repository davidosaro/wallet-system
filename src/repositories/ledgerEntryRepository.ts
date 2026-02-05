import { Transaction } from 'sequelize';
import { LedgerEntry } from '../models/LedgerEntry';
import { EntryType } from '../types/ledgerEntry';

interface CreateLedgerEntryData {
  transactionId: string;
  accountNo: string;
  entryType: EntryType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
}

export const ledgerEntryRepository = {
  async findAll() {
    return LedgerEntry.findAll({ order: [['created_at', 'DESC']] });
  },

  async findById(id: string) {
    return LedgerEntry.findByPk(id);
  },

  async findByTransactionId(transactionId: string) {
    return LedgerEntry.findAll({
      where: { transactionId },
      order: [['created_at', 'ASC']],
    });
  },

  async findByAccountNo(accountNo: string, limit?: number) {
    return LedgerEntry.findAll({
      where: { accountNo },
      order: [['created_at', 'DESC']],
      limit,
    });
  },

  async create(data: CreateLedgerEntryData, transaction?: Transaction) {
    return LedgerEntry.create(data, { transaction });
  },

  async createBulk(entries: CreateLedgerEntryData[], transaction?: Transaction) {
    return LedgerEntry.bulkCreate(entries, { transaction });
  },
};
