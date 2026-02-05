import { Transaction as TransactionType } from 'sequelize';
import { Transaction } from '../models/Transaction';
import { TransactionStatus, TransactionType as TxType } from '../types/transaction';

interface CreateTransactionData {
  idempotencyKey?: string | null;
  transactionType: TxType;
  reference: string;
  metadata?: Record<string, unknown> | null;
}

export const transactionRepository = {
  async findAll() {
    return Transaction.findAll({ order: [['created_at', 'DESC']] });
  },

  async findById(id: string, transaction?: TransactionType) {
    return Transaction.findByPk(id, { transaction });
  },

  async findByIdempotencyKey(
    idempotencyKey: string,
    transaction?: TransactionType
  ) {
    return Transaction.findOne({
      where: { idempotencyKey },
      transaction,
    });
  },

  async findByStatus(status: TransactionStatus) {
    return Transaction.findAll({
      where: { status },
      order: [['created_at', 'DESC']],
    });
  },

  async create(data: CreateTransactionData, transaction?: TransactionType) {
    return Transaction.create(
      {
        ...data,
        status: TransactionStatus.PENDING,
      },
      { transaction }
    );
  },

  async updateStatus(
    id: string,
    status: TransactionStatus,
    errorMessage?: string,
    transaction?: TransactionType
  ) {
    const tx = await Transaction.findByPk(id, { transaction });
    if (!tx) return null;
    return tx.update({ status, errorMessage }, { transaction });
  },

  async markCompleted(id: string, transaction?: TransactionType) {
    return this.updateStatus(
      id,
      TransactionStatus.COMPLETED,
      undefined,
      transaction
    );
  },

  async markFailed(
    id: string,
    errorMessage: string,
    transaction?: TransactionType
  ) {
    return this.updateStatus(
      id,
      TransactionStatus.FAILED,
      errorMessage,
      transaction
    );
  },
};
