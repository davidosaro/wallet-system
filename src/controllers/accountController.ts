import { Request, Response, NextFunction } from 'express';
import { accountService } from '../services/accountService';
import { sendResponse } from '../utils/response';
import { AccountType } from '../types/account';

export const accountController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const accounts = await accountService.getAll();
      sendResponse(res, 200, 'Accounts retrieved successfully', accounts);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const account = await accountService.getById(req.params.id);
      if (!account) {
        return sendResponse(res, 404, 'Account not found');
      }
      sendResponse(res, 200, 'Account retrieved successfully', account);
    } catch (err) {
      next(err);
    }
  },

  async getByAccountNo(req: Request, res: Response, next: NextFunction) {
    try {
      const account = await accountService.getByAccountNo(req.params.accountNo);
      if (!account) {
        return sendResponse(res, 404, 'Account not found');
      }
      sendResponse(res, 200, 'Account retrieved successfully', account);
    } catch (err) {
      next(err);
    }
  },

  async getByType(req: Request, res: Response, next: NextFunction) {
    try {
      const accountType = req.params.type as AccountType;
      if (!Object.values(AccountType).includes(accountType)) {
        return sendResponse(res, 400, 'Invalid account type');
      }
      const accounts = await accountService.getByType(accountType);
      sendResponse(res, 200, 'Accounts retrieved successfully', accounts);
    } catch (err) {
      next(err);
    }
  },

  async createPoolAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const { accountName, currency } = req.body;
      if (!accountName) {
        return sendResponse(res, 400, 'Account name is required');
      }
      const account = await accountService.createPoolAccount({ accountName, currency });
      sendResponse(res, 201, 'Pool account created successfully', account);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { accountType, accountName, currency } = req.body;
      if (!accountType || !accountName) {
        return sendResponse(res, 400, 'Account type and name are required');
      }
      if (!Object.values(AccountType).includes(accountType)) {
        return sendResponse(res, 400, 'Invalid account type');
      }
      const account = await accountService.create({ accountType, accountName, currency });
      sendResponse(res, 201, 'Account created successfully', account);
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const deleted = await accountService.delete(req.params.id);
      if (!deleted) {
        return sendResponse(res, 404, 'Account not found');
      }
      sendResponse(res, 204, 'Account deleted successfully');
    } catch (err) {
      next(err);
    }
  },
};
