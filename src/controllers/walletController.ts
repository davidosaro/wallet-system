import { Request, Response, NextFunction } from 'express';
import { walletService, WalletError } from '../services/walletService';
import { sendResponse } from '../utils/response';

export const walletController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const wallets = await walletService.getAll();
      sendResponse(res, 200, 'Wallets retrieved successfully', wallets);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      // Use account balance as source of truth
      const wallet = await walletService.getByIdWithAccountBalance(req.params.id);
      if (!wallet) {
        return sendResponse(res, 404, 'Wallet not found');
      }
      sendResponse(res, 200, 'Wallet retrieved successfully', wallet);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const wallet = await walletService.create(req.body);
      sendResponse(res, 201, 'Wallet created successfully', wallet);
    } catch (err) {
      if (err instanceof WalletError) {
        const statusCodes: Record<string, number> = {
          WALLET_ALREADY_EXISTS: 409,
        };
        const statusCode = statusCodes[err.code] || 400;
        return sendResponse(res, statusCode, err.message, { code: err.code });
      }
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const deleted = await walletService.delete(req.params.id);
      if (!deleted) {
        return sendResponse(res, 404, 'Wallet not found');
      }
      sendResponse(res, 204, 'Wallet deleted successfully');
    } catch (err) {
      next(err);
    }
  },
};
