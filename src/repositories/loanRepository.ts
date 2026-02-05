import { Transaction as TransactionType } from 'sequelize';
import { Loan } from '../models/Loan';
import { LoanStatus } from '../types/loan';

export const loanRepository = {
  async findAll() {
    return Loan.findAll({ order: [['created_at', 'DESC']] });
  },

  async findById(id: string, transaction?: TransactionType) {
    return Loan.findByPk(id, { transaction });
  },

  async findByIdWithLock(id: string, transaction: TransactionType) {
    return Loan.findByPk(id, {
      lock: transaction.LOCK.UPDATE,
      transaction,
    });
  },

  async findByLoanNumber(loanNumber: string) {
    return Loan.findOne({ where: { loanNumber } });
  },

  async findByAccountNo(accountNo: string) {
    return Loan.findAll({
      where: { accountNo },
      order: [['created_at', 'DESC']],
    });
  },

  async findActiveLoans() {
    return Loan.findAll({
      where: { status: LoanStatus.ACTIVE },
      order: [['created_at', 'ASC']],
    });
  },

  async findByStatus(status: LoanStatus) {
    return Loan.findAll({
      where: { status },
      order: [['created_at', 'DESC']],
    });
  },

  async create(data: any, transaction?: TransactionType) {
    return Loan.create(data, { transaction });
  },

  async update(id: string, data: any, transaction?: TransactionType) {
    const loan = await Loan.findByPk(id, { transaction });
    if (!loan) return null;
    return loan.update(data, { transaction });
  },

  async updateAccruedInterest(
    id: string,
    accruedInterest: number,
    lastAccrualDate: Date,
    transaction?: TransactionType
  ) {
    const loan = await Loan.findByPk(id, { transaction });
    if (!loan) return null;
    return loan.update({ accruedInterest, lastAccrualDate }, { transaction });
  },

  async delete(id: string) {
    const deleted = await Loan.destroy({ where: { id } });
    return deleted > 0;
  },
};
