import crypto from 'crypto';
import { sequelize } from '../config/database';
import { transactionRepository } from '../repositories/transactionRepository';
import { ledgerEntryRepository } from '../repositories/ledgerEntryRepository';
import { accountRepository } from '../repositories/accountRepository';
import { walletRepository } from '../repositories/walletRepository';
import { TransactionType, TransactionStatus } from '../types/transaction';
import { EntryType } from '../types/ledgerEntry';
import {
  FundAccountDto,
  FundWalletDto,
  FundingResponse,
} from '../types/funding';

export class FundingError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'FundingError';
  }
}

function generateReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomUUID().slice(0, 8).toUpperCase();
  return `FND-${timestamp}-${random}`;
}

export const fundingService = {
  /**
   * Fund an account from a source account (typically a pool account)
   * This creates proper double-entry bookkeeping:
   * - DEBIT source account (money out of pool)
   * - CREDIT destination account (money into user's account)
   */
  async fundAccount(
    request: FundAccountDto,
    idempotencyKey?: string
  ): Promise<FundingResponse> {
    const { accountNo, amount, sourceAccountNo, reference, metadata } = request;

    if (amount <= 0) {
      throw new FundingError(
        'Amount must be greater than zero',
        'INVALID_AMOUNT'
      );
    }

    if (accountNo === sourceAccountNo) {
      throw new FundingError(
        'Source and destination cannot be the same',
        'SAME_ACCOUNT'
      );
    }

    // Check idempotency
    if (idempotencyKey) {
      const existingTx =
        await transactionRepository.findByIdempotencyKey(idempotencyKey);
      if (existingTx) {
        const status = existingTx.get('status') as TransactionStatus;
        if (status === TransactionStatus.COMPLETED) {
          return this.buildFundingResponse(existingTx.get('id') as string);
        }
        if (status === TransactionStatus.FAILED) {
          const errorMsg = existingTx.get('errorMessage') as string;
          throw new FundingError(
            errorMsg || 'Previous funding attempt failed',
            'PREVIOUS_FUNDING_FAILED'
          );
        }
      }
    }

    const result = await sequelize.transaction(async (t) => {
      // Lock accounts in consistent order to prevent deadlocks
      const [firstNo, secondNo] =
        sourceAccountNo < accountNo
          ? [sourceAccountNo, accountNo]
          : [accountNo, sourceAccountNo];

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
      const destAccount = accountNo === firstNo ? firstAccount : secondAccount;

      if (!sourceAccount) {
        throw new FundingError(
          'Source account not found',
          'SOURCE_ACCOUNT_NOT_FOUND'
        );
      }
      if (!destAccount) {
        throw new FundingError(
          'Destination account not found',
          'DESTINATION_ACCOUNT_NOT_FOUND'
        );
      }

      // Check currencies match
      const sourceCurrency = sourceAccount.get('currency') as string;
      const destCurrency = destAccount.get('currency') as string;
      if (sourceCurrency !== destCurrency) {
        throw new FundingError(
          'Currency mismatch between accounts',
          'CURRENCY_MISMATCH'
        );
      }

      // For pool accounts funding user wallets, we allow negative balance on pool
      // (represents money that has been disbursed)
      // For other cases, check sufficient balance
      const sourceBalance = parseFloat(
        sourceAccount.get('clearedBalance') as string
      );

      // Calculate new balances
      const destBalance = parseFloat(
        destAccount.get('clearedBalance') as string
      );
      const sourceBalanceAfter = sourceBalance - amount;
      const destBalanceAfter = destBalance + amount;

      // Create the transaction record with all details
      const txReference = reference || generateReference();
      const tx = await transactionRepository.create(
        {
          idempotencyKey: idempotencyKey || null,
          transactionType: TransactionType.FUNDING,
          reference: txReference,
          debitAccountNo: sourceAccountNo,
          creditAccountNo: accountNo,
          amount,
          debitBalanceBefore: sourceBalance,
          debitBalanceAfter: sourceBalanceAfter,
          creditBalanceBefore: destBalance,
          creditBalanceAfter: destBalanceAfter,
          metadata: metadata || null,
        },
        t
      );
      const transactionId = tx.get('id') as string;

      // Create ledger entries (double-entry bookkeeping)
      await ledgerEntryRepository.createBulk(
        [
          {
            transactionId,
            accountNo: sourceAccountNo,
            entryType: EntryType.DEBIT,
            amount,
            balanceBefore: sourceBalance,
            balanceAfter: sourceBalanceAfter,
          },
          {
            transactionId,
            accountNo: accountNo,
            entryType: EntryType.CREDIT,
            amount,
            balanceBefore: destBalance,
            balanceAfter: destBalanceAfter,
          },
        ],
        t
      );

      // Update account balances (both balance and cleared_balance)
      await accountRepository.updateBalanceByAccountNo(
        sourceAccountNo,
        sourceBalanceAfter,
        sourceBalanceAfter,
        t
      );
      await accountRepository.updateBalanceByAccountNo(
        accountNo,
        destBalanceAfter,
        destBalanceAfter,
        t
      );

      // Update wallet balance if destination is a wallet account
      const destWalletId = destAccount.get('walletId') as string | null;
      if (destWalletId) {
        await walletRepository.updateBalance(destWalletId, destBalanceAfter, t);
      }

      // Mark transaction as completed
      await transactionRepository.markCompleted(transactionId, t);

      return {
        transactionId,
        reference: txReference,
        sourceAccountNo,
        destAccountNo: accountNo,
        sourceBalanceBefore: sourceBalance,
        sourceBalanceAfter,
        destBalanceBefore: destBalance,
        destBalanceAfter,
        amount,
        createdAt: tx.get('createdAt') as Date,
      };
    });

    return {
      transactionId: result.transactionId,
      reference: result.reference,
      status: TransactionStatus.COMPLETED,
      sourceAccount: {
        accountNo: result.sourceAccountNo,
        balanceBefore: result.sourceBalanceBefore,
        balanceAfter: result.sourceBalanceAfter,
      },
      destinationAccount: {
        accountNo: result.destAccountNo,
        balanceBefore: result.destBalanceBefore,
        balanceAfter: result.destBalanceAfter,
      },
      amount: result.amount,
      createdAt: result.createdAt,
    };
  },

  /**
   * Fund a wallet by its ID (convenience method)
   * Looks up the wallet's account number and calls fundAccount
   */
  async fundWallet(
    request: FundWalletDto,
    idempotencyKey?: string
  ): Promise<FundingResponse> {
    const { walletId, amount, sourceAccountNo, reference, metadata } = request;

    const wallet = await walletRepository.findById(walletId);
    if (!wallet) {
      throw new FundingError('Wallet not found', 'WALLET_NOT_FOUND');
    }

    const accountNo = wallet.get('accountNo') as string;
    if (!accountNo) {
      throw new FundingError('Wallet has no associated account', 'NO_ACCOUNT');
    }

    return this.fundAccount(
      { accountNo, amount, sourceAccountNo, reference, metadata },
      idempotencyKey
    );
  },

  async buildFundingResponse(transactionId: string): Promise<FundingResponse> {
    const tx = await transactionRepository.findById(transactionId);
    if (!tx) {
      throw new FundingError('Transaction not found', 'TRANSACTION_NOT_FOUND');
    }

    // Try to get details from transaction record first
    const debitAccountNo = tx.get('debitAccountNo') as string | null;
    const creditAccountNo = tx.get('creditAccountNo') as string | null;
    const txAmount = tx.get('amount') as string | null;

    if (debitAccountNo && creditAccountNo && txAmount) {
      return {
        transactionId,
        reference: tx.get('reference') as string,
        status: tx.get('status') as string,
        sourceAccount: {
          accountNo: debitAccountNo,
          balanceBefore: parseFloat(tx.get('debitBalanceBefore') as string),
          balanceAfter: parseFloat(tx.get('debitBalanceAfter') as string),
        },
        destinationAccount: {
          accountNo: creditAccountNo,
          balanceBefore: parseFloat(tx.get('creditBalanceBefore') as string),
          balanceAfter: parseFloat(tx.get('creditBalanceAfter') as string),
        },
        amount: parseFloat(txAmount),
        createdAt: tx.get('createdAt') as Date,
      };
    }

    // Fallback to ledger entries for older transactions
    const entries =
      await ledgerEntryRepository.findByTransactionId(transactionId);
    const debitEntry = entries.find(
      (e) => e.get('entryType') === EntryType.DEBIT
    );
    const creditEntry = entries.find(
      (e) => e.get('entryType') === EntryType.CREDIT
    );

    if (!debitEntry || !creditEntry) {
      throw new FundingError(
        'Invalid transaction state',
        'INVALID_TRANSACTION'
      );
    }

    return {
      transactionId,
      reference: tx.get('reference') as string,
      status: tx.get('status') as string,
      sourceAccount: {
        accountNo: debitEntry.get('accountNo') as string,
        balanceBefore: parseFloat(debitEntry.get('balanceBefore') as string),
        balanceAfter: parseFloat(debitEntry.get('balanceAfter') as string),
      },
      destinationAccount: {
        accountNo: creditEntry.get('accountNo') as string,
        balanceBefore: parseFloat(creditEntry.get('balanceBefore') as string),
        balanceAfter: parseFloat(creditEntry.get('balanceAfter') as string),
      },
      amount: parseFloat(debitEntry.get('amount') as string),
      createdAt: tx.get('createdAt') as Date,
    };
  },
};
