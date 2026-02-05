import { Request, Response, NextFunction } from 'express';
import { walletService } from '../services/walletService';
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
      const wallet = await walletService.getById(req.params.id);
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
      next(err);
    }
  },

  async deposit(req: Request, res: Response, next: NextFunction) {
    try {
      const { amount } = req.body;
      const wallet = await walletService.deposit(req.params.id, amount);
      if (!wallet) {
        return sendResponse(res, 404, 'Wallet not found');
      }
      sendResponse(res, 200, 'Deposit successful', wallet);
    } catch (err) {
      next(err);
    }
  },

  async withdraw(req: Request, res: Response, next: NextFunction) {
    try {
      const { amount } = req.body;
      const wallet = await walletService.withdraw(req.params.id, amount);
      if (!wallet) {
        return sendResponse(res, 404, 'Wallet not found');
      }
      sendResponse(res, 200, 'Withdrawal successful', wallet);
    } catch (err) {
      next(err);
    }
  },

  async transfer(req: Request, res: Response, next: NextFunction) {
    try {
      const { toWalletId, amount } = req.body;
      const result = await walletService.transfer(req.params.id, toWalletId, amount);
      sendResponse(res, 200, 'Transfer successful', result);
    } catch (err) {
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
