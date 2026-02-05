import { Request, Response, NextFunction } from 'express';
import { transferService, TransferError } from '../services/transferService';
import { sendResponse } from '../utils/response';

const IDEMPOTENCY_HEADER = 'idempotency-key';

export const transferController = {
  async transfer(req: Request, res: Response, next: NextFunction) {
    try {
      const idempotencyKey = req.headers[IDEMPOTENCY_HEADER] as string | undefined;
      const { debitAccountNo, creditAccountNo, amount, reference, metadata } = req.body;

      if (!debitAccountNo || !creditAccountNo || amount === undefined) {
        return sendResponse(
          res,
          400,
          'debitAccountNo, creditAccountNo, and amount are required'
        );
      }

      if (debitAccountNo === creditAccountNo) {
        return sendResponse(res, 400, 'Cannot transfer to the same account');
      }

      const result = await transferService.transfer(
        { debitAccountNo, creditAccountNo, amount, reference, metadata },
        idempotencyKey
      );

      sendResponse(res, 201, 'Transfer completed successfully', result);
    } catch (err) {
      if (err instanceof TransferError) {
        const statusCodes: Record<string, number> = {
          INVALID_AMOUNT: 400,
          ACCOUNT_NOT_FOUND: 404,
          CURRENCY_MISMATCH: 400,
          INSUFFICIENT_BALANCE: 400,
          PREVIOUS_TRANSFER_FAILED: 409,
          TRANSACTION_NOT_FOUND: 404,
          INVALID_TRANSACTION: 500,
        };
        const statusCode = statusCodes[err.code] || 400;
        return sendResponse(res, statusCode, err.message, { code: err.code });
      }
      next(err);
    }
  },

  async getTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const transaction = await transferService.getTransaction(req.params.id);
      if (!transaction) {
        return sendResponse(res, 404, 'Transaction not found');
      }
      sendResponse(res, 200, 'Transaction retrieved successfully', transaction);
    } catch (err) {
      next(err);
    }
  },

  async getTransactionDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const transactionId = req.params.id;
      const transaction = await transferService.getTransaction(transactionId);
      if (!transaction) {
        return sendResponse(res, 404, 'Transaction not found');
      }

      const response = await transferService.buildTransferResponse(transactionId);
      sendResponse(res, 200, 'Transaction details retrieved successfully', response);
    } catch (err) {
      if (err instanceof TransferError) {
        return sendResponse(res, 404, err.message);
      }
      next(err);
    }
  },

  async getLedgerEntries(req: Request, res: Response, next: NextFunction) {
    try {
      const entries = await transferService.getLedgerEntries(req.params.id);
      sendResponse(res, 200, 'Ledger entries retrieved successfully', entries);
    } catch (err) {
      next(err);
    }
  },

  async getAccountLedger(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : undefined;
      const entries = await transferService.getAccountLedger(
        req.params.accountNo,
        limit
      );
      sendResponse(res, 200, 'Account ledger retrieved successfully', entries);
    } catch (err) {
      next(err);
    }
  },
};
