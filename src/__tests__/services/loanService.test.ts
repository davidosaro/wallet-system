import { loanService, LoanError } from '../../services/loanService';
import { LoanStatus } from '../../types/loan';
import {
  createTestUser,
  createTestWallet,
  createTestPoolAccount,
} from '../factories';

describe('LoanService', () => {
  describe('createLoan', () => {
    it('should create a loan with default interest rate', async () => {
      const user = await createTestUser();
      const wallet = await createTestWallet(user.get('id') as string);
      const accountNo = wallet.get('accountNo') as string;

      const loan = await loanService.createLoan({
        accountNo,
        principalAmount: 100000,
      });

      expect(loan.status).toBe(LoanStatus.PENDING);
      expect(loan.principalAmount).toBe(100000);
      expect(loan.outstandingPrincipal).toBe(100000);
      expect(loan.interestRate).toBe(0.275); // 27.5%
      expect(loan.accruedInterest).toBe(0);
      expect(loan.loanNumber).toMatch(/^LOAN-/);
    });

    it('should create a loan with custom interest rate', async () => {
      const user = await createTestUser();
      const wallet = await createTestWallet(user.get('id') as string);
      const accountNo = wallet.get('accountNo') as string;

      const loan = await loanService.createLoan({
        accountNo,
        principalAmount: 50000,
        interestRate: 0.15, // 15%
      });

      expect(loan.interestRate).toBe(0.15);
    });

    it('should throw error for invalid principal amount (zero)', async () => {
      const user = await createTestUser();
      const wallet = await createTestWallet(user.get('id') as string);
      const accountNo = wallet.get('accountNo') as string;

      await expect(
        loanService.createLoan({
          accountNo,
          principalAmount: 0,
        })
      ).rejects.toMatchObject({
        code: 'INVALID_AMOUNT',
        message: 'Principal amount must be greater than zero',
      });
    });

    it('should throw error for negative principal amount', async () => {
      const user = await createTestUser();
      const wallet = await createTestWallet(user.get('id') as string);
      const accountNo = wallet.get('accountNo') as string;

      await expect(
        loanService.createLoan({
          accountNo,
          principalAmount: -5000,
        })
      ).rejects.toMatchObject({
        code: 'INVALID_AMOUNT',
      });
    });

    it('should throw error for non-existent account', async () => {
      await expect(
        loanService.createLoan({
          accountNo: 'ACC-NONEXISTENT-001',
          principalAmount: 100000,
        })
      ).rejects.toMatchObject({
        code: 'ACCOUNT_NOT_FOUND',
      });
    });

    it('should throw error for currency mismatch', async () => {
      const user = await createTestUser();
      const wallet = await createTestWallet(user.get('id') as string, {
        currency: 'NGN',
      });
      const accountNo = wallet.get('accountNo') as string;

      await expect(
        loanService.createLoan({
          accountNo,
          principalAmount: 100000,
          currency: 'USD', // Mismatch with account currency
        })
      ).rejects.toMatchObject({
        code: 'CURRENCY_MISMATCH',
      });
    });
  });

  describe('disburseLoan', () => {
    it('should successfully disburse a pending loan', async () => {
      const user = await createTestUser();
      const wallet = await createTestWallet(user.get('id') as string);
      const pool = await createTestPoolAccount({ initialBalance: 1000000 });
      const accountNo = wallet.get('accountNo') as string;
      const sourceAccountNo = pool.get('accountNo') as string;

      // Create loan
      const loan = await loanService.createLoan({
        accountNo,
        principalAmount: 100000,
      });

      // Disburse loan
      const disbursed = await loanService.disburseLoan({
        loanId: loan.id,
        sourceAccountNo,
      });

      expect(disbursed.status).toBe(LoanStatus.ACTIVE);
      expect(disbursed.disbursementDate).toBeDefined();

      // Check wallet was funded
      const reloadedWallet = await wallet.reload();
      expect(parseFloat(reloadedWallet.get('balance') as string)).toBe(100000);
    });

    it('should throw error for non-existent loan', async () => {
      const pool = await createTestPoolAccount();
      const sourceAccountNo = pool.get('accountNo') as string;

      await expect(
        loanService.disburseLoan({
          loanId: '00000000-0000-0000-0000-000000000000',
          sourceAccountNo,
        })
      ).rejects.toMatchObject({
        code: 'LOAN_NOT_FOUND',
      });
    });

    it('should throw error when trying to disburse already active loan', async () => {
      const user = await createTestUser();
      const wallet = await createTestWallet(user.get('id') as string);
      const pool = await createTestPoolAccount({ initialBalance: 1000000 });
      const accountNo = wallet.get('accountNo') as string;
      const sourceAccountNo = pool.get('accountNo') as string;

      // Create and disburse loan
      const loan = await loanService.createLoan({
        accountNo,
        principalAmount: 100000,
      });
      await loanService.disburseLoan({
        loanId: loan.id,
        sourceAccountNo,
      });

      // Try to disburse again
      await expect(
        loanService.disburseLoan({
          loanId: loan.id,
          sourceAccountNo,
        })
      ).rejects.toMatchObject({
        code: 'INVALID_LOAN_STATUS',
      });
    });

    it('should throw error for non-existent source account', async () => {
      const user = await createTestUser();
      const wallet = await createTestWallet(user.get('id') as string);
      const accountNo = wallet.get('accountNo') as string;

      const loan = await loanService.createLoan({
        accountNo,
        principalAmount: 100000,
      });

      await expect(
        loanService.disburseLoan({
          loanId: loan.id,
          sourceAccountNo: 'ACC-NONEXISTENT-001',
        })
      ).rejects.toMatchObject({
        code: 'ACCOUNT_NOT_FOUND',
      });
    });

    it('should throw error for currency mismatch between pool and borrower', async () => {
      const user = await createTestUser();
      const wallet = await createTestWallet(user.get('id') as string, {
        currency: 'USD',
      });
      const pool = await createTestPoolAccount({
        currency: 'NGN',
        initialBalance: 1000000,
      });
      const accountNo = wallet.get('accountNo') as string;
      const sourceAccountNo = pool.get('accountNo') as string;

      const loan = await loanService.createLoan({
        accountNo,
        principalAmount: 100000,
      });

      await expect(
        loanService.disburseLoan({
          loanId: loan.id,
          sourceAccountNo,
        })
      ).rejects.toMatchObject({
        code: 'CURRENCY_MISMATCH',
      });
    });
  });

  describe('getLoan', () => {
    it('should retrieve loan by id', async () => {
      const user = await createTestUser();
      const wallet = await createTestWallet(user.get('id') as string);
      const accountNo = wallet.get('accountNo') as string;

      const created = await loanService.createLoan({
        accountNo,
        principalAmount: 100000,
      });

      const retrieved = await loanService.getLoan(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.loanNumber).toBe(created.loanNumber);
    });

    it('should return null for non-existent loan', async () => {
      const retrieved = await loanService.getLoan(
        '00000000-0000-0000-0000-000000000000'
      );

      expect(retrieved).toBeNull();
    });
  });

  describe('getAllLoans', () => {
    it('should retrieve all loans', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const wallet1 = await createTestWallet(user1.get('id') as string);
      const wallet2 = await createTestWallet(user2.get('id') as string);

      await loanService.createLoan({
        accountNo: wallet1.get('accountNo') as string,
        principalAmount: 100000,
      });
      await loanService.createLoan({
        accountNo: wallet2.get('accountNo') as string,
        principalAmount: 50000,
      });

      const loans = await loanService.getAllLoans();

      expect(loans).toHaveLength(2);
    });

    it('should return empty array when no loans exist', async () => {
      const loans = await loanService.getAllLoans();

      expect(loans).toEqual([]);
    });
  });
});
