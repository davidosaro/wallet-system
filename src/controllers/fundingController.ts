import { Request, Response, NextFunction } from 'express';
import { fundingService, FundingError } from '../services/fundingService';
import { sendResponse } from '../utils/response';

const IDEMPOTENCY_HEADER = 'idempotency-key';

export const fundingController = {
  async fundAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const idempotencyKey = req.headers[IDEMPOTENCY_HEADER] as string | undefined;
      const { accountNo, amount, sourceAccountNo, reference, metadata } = req.body;

      if (!accountNo || !sourceAccountNo || amount === undefined) {
        return sendResponse(
          res,
          400,
          'accountNo, sourceAccountNo, and amount are required'
        );
      }

      const result = await fundingService.fundAccount(
        { accountNo, amount, sourceAccountNo, reference, metadata },
        idempotencyKey
      );

      sendResponse(res, 201, 'Account funded successfully', result);
    } catch (err) {
      if (err instanceof FundingError) {
        const statusCodes: Record<string, number> = {
          INVALID_AMOUNT: 400,
          SAME_ACCOUNT: 400,
          SOURCE_ACCOUNT_NOT_FOUND: 404,
          DESTINATION_ACCOUNT_NOT_FOUND: 404,
          CURRENCY_MISMATCH: 400,
          PREVIOUS_FUNDING_FAILED: 409,
          WALLET_NOT_FOUND: 404,
          NO_ACCOUNT: 400,
        };
        const statusCode = statusCodes[err.code] || 400;
        return sendResponse(res, statusCode, err.message, { code: err.code });
      }
      next(err);
    }
  },

  async fundWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const idempotencyKey = req.headers[IDEMPOTENCY_HEADER] as string | undefined;
      const walletId = req.params.walletId;
      const { amount, sourceAccountNo, reference, metadata } = req.body;

      if (!sourceAccountNo || amount === undefined) {
        return sendResponse(
          res,
          400,
          'sourceAccountNo and amount are required'
        );
      }

      const result = await fundingService.fundWallet(
        { walletId, amount, sourceAccountNo, reference, metadata },
        idempotencyKey
      );

      sendResponse(res, 201, 'Wallet funded successfully', result);
    } catch (err) {
      if (err instanceof FundingError) {
        const statusCodes: Record<string, number> = {
          INVALID_AMOUNT: 400,
          SAME_ACCOUNT: 400,
          SOURCE_ACCOUNT_NOT_FOUND: 404,
          DESTINATION_ACCOUNT_NOT_FOUND: 404,
          CURRENCY_MISMATCH: 400,
          PREVIOUS_FUNDING_FAILED: 409,
          WALLET_NOT_FOUND: 404,
          NO_ACCOUNT: 400,
        };
        const statusCode = statusCodes[err.code] || 400;
        return sendResponse(res, statusCode, err.message, { code: err.code });
      }
      next(err);
    }
  },
};
