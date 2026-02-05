import { Transaction as TransactionType, Op } from 'sequelize';
import { DailyInterestAccrual } from '../models/DailyInterestAccrual';
import { CreateDailyAccrualDto } from '../types/interestAccrual';

export const dailyInterestAccrualRepository = {
  async findAll() {
    return DailyInterestAccrual.findAll({ order: [['accrual_date', 'DESC']] });
  },

  async findById(id: string) {
    return DailyInterestAccrual.findByPk(id);
  },

  async findByLoanId(loanId: string, limit?: number) {
    return DailyInterestAccrual.findAll({
      where: { loanId },
      order: [['accrual_date', 'DESC']],
      ...(limit && { limit }),
    });
  },

  async findByLoanIdAndDate(loanId: string, accrualDate: string) {
    return DailyInterestAccrual.findOne({
      where: { loanId, accrualDate },
    });
  },

  async findByDateRange(
    loanId: string,
    startDate: string,
    endDate: string
  ) {
    return DailyInterestAccrual.findAll({
      where: {
        loanId,
        accrualDate: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [['accrual_date', 'ASC']],
    });
  },

  async getLastAccrual(loanId: string) {
    return DailyInterestAccrual.findOne({
      where: { loanId },
      order: [['accrual_date', 'DESC']],
    });
  },

  async create(data: CreateDailyAccrualDto, transaction?: TransactionType) {
    return DailyInterestAccrual.create(data, { transaction });
  },

  async createBulk(
    data: CreateDailyAccrualDto[],
    transaction?: TransactionType
  ) {
    return DailyInterestAccrual.bulkCreate(data, { transaction });
  },
};
