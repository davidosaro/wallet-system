import { Request, Response, NextFunction } from 'express';
import { loanService, LoanError } from '../services/loanService';
import { interestAccrualService, InterestAccrualError } from '../services/interestAccrualService';
import { sendResponse } from '../utils/response';

export const loanController = {
  async createLoan(req: Request, res: Response, next: NextFunction) {
    try {
      const loan = await loanService.createLoan(req.body);
      sendResponse(res, 201, 'Loan created successfully', loan);
    } catch (err) {
      if (err instanceof LoanError) {
        const statusCodes: Record<string, number> = {
          INVALID_AMOUNT: 400,
          ACCOUNT_NOT_FOUND: 404,
          CURRENCY_MISMATCH: 400,
        };
        const statusCode = statusCodes[err.code] || 400;
        return sendResponse(res, statusCode, err.message, { code: err.code });
      }
      next(err);
    }
  },

  async disburseLoan(req: Request, res: Response, next: NextFunction) {
    try {
      const loanId = req.params.loanId;
      const { sourceAccountNo, disbursementDate } = req.body;

      if (!sourceAccountNo) {
        return sendResponse(res, 400, 'sourceAccountNo is required');
      }

      const loan = await loanService.disburseLoan({
        loanId,
        sourceAccountNo,
        disbursementDate,
      });

      sendResponse(res, 200, 'Loan disbursed successfully', loan);
    } catch (err) {
      if (err instanceof LoanError) {
        const statusCodes: Record<string, number> = {
          LOAN_NOT_FOUND: 404,
          INVALID_LOAN_STATUS: 400,
          ACCOUNT_NOT_FOUND: 404,
          CURRENCY_MISMATCH: 400,
        };
        const statusCode = statusCodes[err.code] || 400;
        return sendResponse(res, statusCode, err.message, { code: err.code });
      }
      next(err);
    }
  },

  async getLoan(req: Request, res: Response, next: NextFunction) {
    try {
      const loan = await loanService.getLoan(req.params.loanId);
      if (!loan) {
        return sendResponse(res, 404, 'Loan not found');
      }
      sendResponse(res, 200, 'Loan retrieved successfully', loan);
    } catch (err) {
      next(err);
    }
  },

  async getAllLoans(req: Request, res: Response, next: NextFunction) {
    try {
      const loans = await loanService.getAllLoans();
      sendResponse(res, 200, 'Loans retrieved successfully', loans);
    } catch (err) {
      next(err);
    }
  },

  async getLoansByAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const loans = await loanService.getLoansByAccount(req.params.accountNo);
      sendResponse(res, 200, 'Account loans retrieved successfully', loans);
    } catch (err) {
      next(err);
    }
  },

  async accrueInterest(req: Request, res: Response, next: NextFunction) {
    try {
      const { loanId, accrualDate } = req.body;
      const result = await interestAccrualService.accrueInterest({
        loanId,
        accrualDate: accrualDate ? new Date(accrualDate) : undefined,
      });
      sendResponse(res, 200, 'Interest accrued successfully', result);
    } catch (err) {
      if (err instanceof InterestAccrualError) {
        const statusCodes: Record<string, number> = {
          LOAN_NOT_FOUND: 404,
          INVALID_LOAN_STATUS: 400,
          LOAN_NOT_DISBURSED: 400,
          INVALID_ACCRUAL_DATE: 400,
        };
        const statusCode = statusCodes[err.code] || 400;
        return sendResponse(res, statusCode, err.message, { code: err.code });
      }
      next(err);
    }
  },

  async getLoanAccrualHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const loanId = req.params.loanId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const history = await interestAccrualService.getLoanAccrualHistory(loanId, limit);
      sendResponse(res, 200, 'Accrual history retrieved successfully', history);
    } catch (err) {
      next(err);
    }
  },
};
