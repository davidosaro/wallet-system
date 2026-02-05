import crypto from 'crypto';
import { sequelize } from '../config/database';
import { loanRepository } from '../repositories/loanRepository';
import { accountRepository } from '../repositories/accountRepository';
import { transactionRepository } from '../repositories/transactionRepository';
import { ledgerEntryRepository } from '../repositories/ledgerEntryRepository';
import { walletRepository } from '../repositories/walletRepository';
import {
  CreateLoanDto,
  DisburseLoanDto,
  LoanStatus,
  LoanResponse,
} from '../types/loan';
import { TransactionType, TransactionStatus } from '../types/transaction';
import { EntryType } from '../types/ledgerEntry';

export class LoanError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'LoanError';
  }
}

const DEFAULT_ANNUAL_RATE = 0.275; // 27.5%

function generateLoanNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomUUID().slice(0, 6).toUpperCase();
  return `LOAN-${timestamp}-${random}`;
}

export const loanService = {
  /**
   * Create a loan (booking the loan, not yet disbursed)
   */
  async createLoan(data: CreateLoanDto): Promise<LoanResponse> {
    const {
      accountNo,
      principalAmount,
      interestRate,
      maturityDate,
      currency,
      metadata,
    } = data;

    // Validate principal amount
    if (principalAmount <= 0) {
      throw new LoanError(
        'Principal amount must be greater than zero',
        'INVALID_AMOUNT'
      );
    }

    // Verify account exists
    const account = await accountRepository.findByAccountNo(accountNo);
    if (!account) {
      throw new LoanError('Account not found', 'ACCOUNT_NOT_FOUND');
    }

    const accountCurrency = account.get('currency') as string;
    const loanCurrency = currency || accountCurrency;

    if (accountCurrency !== loanCurrency) {
      throw new LoanError(
        'Currency mismatch between loan and account',
        'CURRENCY_MISMATCH'
      );
    }

    const loanNumber = generateLoanNumber();
    const rate =
      interestRate !== undefined ? interestRate : DEFAULT_ANNUAL_RATE;

    const loan = await loanRepository.create({
      loanNumber,
      accountNo,
      principalAmount,
      outstandingPrincipal: principalAmount,
      interestRate: rate,
      accruedInterest: 0,
      status: LoanStatus.PENDING,
      maturityDate,
      currency: loanCurrency,
      metadata,
    });

    return {
      id: loan.get('id') as string,
      loanNumber: loan.get('loanNumber') as string,
      accountNo: loan.get('accountNo') as string,
      principalAmount: parseFloat(loan.get('principalAmount') as string),
      outstandingPrincipal: parseFloat(
        loan.get('outstandingPrincipal') as string
      ),
      interestRate: parseFloat(loan.get('interestRate') as string),
      accruedInterest: parseFloat(loan.get('accruedInterest') as string),
      status: loan.get('status') as string,
      disbursementDate: loan.get('disbursementDate') as Date | undefined,
      lastAccrualDate: loan.get('lastAccrualDate') as Date | undefined,
      maturityDate: loan.get('maturityDate') as Date | undefined,
      currency: loan.get('currency') as string,
      createdAt: loan.get('createdAt') as Date,
    };
  },

  /**
   * Disburse a loan (transfer funds from source account to borrower account)
   */
  async disburseLoan(data: DisburseLoanDto): Promise<LoanResponse> {
    const { loanId, sourceAccountNo, disbursementDate } = data;

    const result = await sequelize.transaction(async (t) => {
      // Lock and fetch the loan
      const loan = await loanRepository.findByIdWithLock(loanId, t);
      if (!loan) {
        throw new LoanError('Loan not found', 'LOAN_NOT_FOUND');
      }

      const status = loan.get('status') as LoanStatus;
      if (status !== LoanStatus.PENDING) {
        throw new LoanError(
          `Loan cannot be disbursed. Current status: ${status}`,
          'INVALID_LOAN_STATUS'
        );
      }

      const borrowerAccountNo = loan.get('accountNo') as string;
      const principal = parseFloat(loan.get('principalAmount') as string);
      const currency = loan.get('currency') as string;

      // Lock accounts in consistent order
      const [firstNo, secondNo] =
        sourceAccountNo < borrowerAccountNo
          ? [sourceAccountNo, borrowerAccountNo]
          : [borrowerAccountNo, sourceAccountNo];

      const firstAccount = await accountRepository.findByAccountNoWithLock(
        firstNo,
        t
      );
      const secondAccount = await accountRepository.findByAccountNoWithLock(
        secondNo,
        t
      );

      const sourceAccount =
        sourceAccountNo === firstNo ? firstAccount : secondAccount;
      const borrowerAccount =
        borrowerAccountNo === firstNo ? firstAccount : secondAccount;

      if (!sourceAccount || !borrowerAccount) {
        throw new LoanError(
          'Source or borrower account not found',
          'ACCOUNT_NOT_FOUND'
        );
      }

      // Verify currencies match
      const sourceCurrency = sourceAccount.get('currency') as string;
      const borrowerCurrency = borrowerAccount.get('currency') as string;
      if (sourceCurrency !== currency || borrowerCurrency !== currency) {
        throw new LoanError('Currency mismatch', 'CURRENCY_MISMATCH');
      }

      // Get balances
      const sourceBalance = parseFloat(
        sourceAccount.get('clearedBalance') as string
      );
      const borrowerBalance = parseFloat(
        borrowerAccount.get('clearedBalance') as string
      );

      // Calculate new balances
      const sourceBalanceAfter = sourceBalance - principal;
      const borrowerBalanceAfter = borrowerBalance + principal;

      // Create transaction record
      const loanNumber = loan.get('loanNumber') as string;
      const txReference = `DISBURSEMENT-${loanNumber}`;
      const transaction = await transactionRepository.create(
        {
          transactionType: TransactionType.DISBURSEMENT,
          reference: txReference,
          debitAccountNo: sourceAccountNo,
          creditAccountNo: borrowerAccountNo,
          amount: principal,
          debitBalanceBefore: sourceBalance,
          debitBalanceAfter: sourceBalanceAfter,
          creditBalanceBefore: borrowerBalance,
          creditBalanceAfter: borrowerBalanceAfter,
          metadata: { loanId, loanNumber },
        },
        t
      );
      const transactionId = transaction.get('id') as string;

      // Create ledger entries
      await ledgerEntryRepository.createBulk(
        [
          {
            transactionId,
            accountNo: sourceAccountNo,
            entryType: EntryType.DEBIT,
            amount: principal,
            balanceBefore: sourceBalance,
            balanceAfter: sourceBalanceAfter,
          },
          {
            transactionId,
            accountNo: borrowerAccountNo,
            entryType: EntryType.CREDIT,
            amount: principal,
            balanceBefore: borrowerBalance,
            balanceAfter: borrowerBalanceAfter,
          },
        ],
        t
      );

      // Update account balances
      await accountRepository.updateBalanceByAccountNo(
        sourceAccountNo,
        sourceBalanceAfter,
        sourceBalanceAfter,
        t
      );
      await accountRepository.updateBalanceByAccountNo(
        borrowerAccountNo,
        borrowerBalanceAfter,
        borrowerBalanceAfter,
        t
      );

      // Update wallet balance if borrower account is linked to a wallet
      const borrowerWalletId = borrowerAccount.get('walletId') as string | null;
      if (borrowerWalletId) {
        await walletRepository.updateBalance(
          borrowerWalletId,
          borrowerBalanceAfter,
          t
        );
      }

      // Mark transaction as completed
      await transactionRepository.markCompleted(transactionId, t);

      // Update loan status
      const disbursement = disbursementDate || new Date();
      await loanRepository.update(
        loanId,
        {
          status: LoanStatus.ACTIVE,
          disbursementDate: disbursement,
        },
        t
      );

      return {
        ...loan.toJSON(),
        status: LoanStatus.ACTIVE,
        disbursementDate: disbursement,
      };
    });

    return {
      id: result.id,
      loanNumber: result.loanNumber,
      accountNo: result.accountNo,
      principalAmount:
        typeof result.principalAmount === 'string'
          ? parseFloat(result.principalAmount)
          : result.principalAmount,
      outstandingPrincipal:
        typeof result.outstandingPrincipal === 'string'
          ? parseFloat(result.outstandingPrincipal)
          : result.outstandingPrincipal,
      interestRate:
        typeof result.interestRate === 'string'
          ? parseFloat(result.interestRate)
          : result.interestRate,
      accruedInterest:
        typeof result.accruedInterest === 'string'
          ? parseFloat(result.accruedInterest)
          : result.accruedInterest,
      status: result.status,
      disbursementDate: result.disbursementDate || undefined,
      lastAccrualDate: result.lastAccrualDate || undefined,
      maturityDate: result.maturityDate || undefined,
      currency: result.currency,
      createdAt: result.createdAt || new Date(),
    };
  },

  async getLoan(id: string): Promise<LoanResponse | null> {
    const loan = await loanRepository.findById(id);
    if (!loan) return null;

    return {
      id: loan.get('id') as string,
      loanNumber: loan.get('loanNumber') as string,
      accountNo: loan.get('accountNo') as string,
      principalAmount: parseFloat(loan.get('principalAmount') as string),
      outstandingPrincipal: parseFloat(
        loan.get('outstandingPrincipal') as string
      ),
      interestRate: parseFloat(loan.get('interestRate') as string),
      accruedInterest: parseFloat(loan.get('accruedInterest') as string),
      status: loan.get('status') as string,
      disbursementDate: loan.get('disbursementDate') as Date | undefined,
      lastAccrualDate: loan.get('lastAccrualDate') as Date | undefined,
      maturityDate: loan.get('maturityDate') as Date | undefined,
      currency: loan.get('currency') as string,
      createdAt: loan.get('createdAt') as Date,
    };
  },

  async getAllLoans() {
    return loanRepository.findAll();
  },

  async getLoansByAccount(accountNo: string) {
    return loanRepository.findByAccountNo(accountNo);
  },

  async getActiveLoans() {
    return loanRepository.findActiveLoans();
  },
};
