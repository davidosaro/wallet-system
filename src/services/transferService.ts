import crypto from 'crypto';
import { sequelize } from '../config/database';
import { transactionRepository } from '../repositories/transactionRepository';
import { ledgerEntryRepository } from '../repositories/ledgerEntryRepository';
import { accountRepository } from '../repositories/accountRepository';
import { walletRepository } from '../repositories/walletRepository';
import { TransactionType, TransactionStatus } from '../types/transaction';
import { EntryType } from '../types/ledgerEntry';
import { TransferRequestDto, TransferResponse } from '../types/transfer';

export class TransferError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'TransferError';
  }
}

function generateReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomUUID().slice(0, 8).toUpperCase();
  return `TRF-${timestamp}-${random}`;
}

export const transferService = {
  async transfer(
    request: TransferRequestDto,
    idempotencyKey?: string
  ): Promise<TransferResponse> {
    const { debitAccountNo, creditAccountNo, amount, reference, metadata } = request;

    // Validate amount
    if (amount <= 0) {
      throw new TransferError('Amount must be greater than zero', 'INVALID_AMOUNT');
    }

    // Check for idempotency - return existing transaction if already processed
    if (idempotencyKey) {
      const existingTx = await transactionRepository.findByIdempotencyKey(idempotencyKey);
      if (existingTx) {
        const status = existingTx.get('status') as TransactionStatus;
        if (status === TransactionStatus.COMPLETED) {
          // Return the existing successful transaction
          return this.buildTransferResponse(existingTx.get('id') as string);
        }
        if (status === TransactionStatus.FAILED) {
          const errorMsg = existingTx.get('errorMessage') as string;
          throw new TransferError(
            errorMsg || 'Previous transfer attempt failed',
            'PREVIOUS_TRANSFER_FAILED'
          );
        }
        // If PENDING, we'll continue and the unique constraint will handle duplicates
      }
    }

    // Execute transfer within a transaction with row-level locking
    const result = await sequelize.transaction(async (t) => {
      // Acquire locks on both accounts in consistent order to prevent deadlocks
      const [firstNo, secondNo] =
        debitAccountNo < creditAccountNo
          ? [debitAccountNo, creditAccountNo]
          : [creditAccountNo, debitAccountNo];

      const firstAccount = await accountRepository.findByAccountNoWithLock(firstNo, t);
      const secondAccount = await accountRepository.findByAccountNoWithLock(secondNo, t);

      const debitAccount = debitAccountNo === firstNo ? firstAccount : secondAccount;
      const creditAccount = creditAccountNo === firstNo ? firstAccount : secondAccount;

      if (!debitAccount || !creditAccount) {
        throw new TransferError('One or both accounts not found', 'ACCOUNT_NOT_FOUND');
      }

      // Check currencies match
      const debitCurrency = debitAccount.get('currency') as string;
      const creditCurrency = creditAccount.get('currency') as string;
      if (debitCurrency !== creditCurrency) {
        throw new TransferError(
          'Currency mismatch between accounts',
          'CURRENCY_MISMATCH'
        );
      }

      // Check sufficient balance (use clearedBalance as source of truth)
      const debitBalance = parseFloat(debitAccount.get('clearedBalance') as string);
      if (debitBalance < amount) {
        throw new TransferError('Insufficient balance', 'INSUFFICIENT_BALANCE');
      }

      // Calculate new balances
      const creditBalance = parseFloat(creditAccount.get('clearedBalance') as string);
      const debitBalanceAfter = debitBalance - amount;
      const creditBalanceAfter = creditBalance + amount;

      // Create the transaction record with all details
      const txReference = reference || generateReference();
      const tx = await transactionRepository.create(
        {
          idempotencyKey: idempotencyKey || null,
          transactionType: TransactionType.TRANSFER,
          reference: txReference,
          debitAccountNo,
          creditAccountNo,
          amount,
          debitBalanceBefore: debitBalance,
          debitBalanceAfter,
          creditBalanceBefore: creditBalance,
          creditBalanceAfter,
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
            accountNo: debitAccountNo,
            entryType: EntryType.DEBIT,
            amount,
            balanceBefore: debitBalance,
            balanceAfter: debitBalanceAfter,
          },
          {
            transactionId,
            accountNo: creditAccountNo,
            entryType: EntryType.CREDIT,
            amount,
            balanceBefore: creditBalance,
            balanceAfter: creditBalanceAfter,
          },
        ],
        t
      );

      // Update account balances
      await accountRepository.updateBalanceByAccountNo(
        debitAccountNo,
        debitBalanceAfter,
        debitBalanceAfter,
        t
      );
      await accountRepository.updateBalanceByAccountNo(
        creditAccountNo,
        creditBalanceAfter,
        creditBalanceAfter,
        t
      );

      // Sync wallet balances if accounts are linked to wallets
      const debitWalletId = debitAccount.get('walletId') as string | null;
      const creditWalletId = creditAccount.get('walletId') as string | null;

      if (debitWalletId) {
        await walletRepository.updateBalance(debitWalletId, debitBalanceAfter, t);
      }
      if (creditWalletId) {
        await walletRepository.updateBalance(creditWalletId, creditBalanceAfter, t);
      }

      // Mark transaction as completed
      await transactionRepository.markCompleted(transactionId, t);

      return {
        transactionId,
        reference: txReference,
        debitAccountNo,
        creditAccountNo,
        debitBalanceBefore: debitBalance,
        debitBalanceAfter,
        creditBalanceBefore: creditBalance,
        creditBalanceAfter,
        amount,
        createdAt: tx.get('createdAt') as Date,
      };
    });

    return {
      transactionId: result.transactionId,
      reference: result.reference,
      status: TransactionStatus.COMPLETED,
      debitAccount: {
        accountNo: result.debitAccountNo,
        balanceBefore: result.debitBalanceBefore,
        balanceAfter: result.debitBalanceAfter,
      },
      creditAccount: {
        accountNo: result.creditAccountNo,
        balanceBefore: result.creditBalanceBefore,
        balanceAfter: result.creditBalanceAfter,
      },
      amount: result.amount,
      createdAt: result.createdAt,
    };
  },

  async buildTransferResponse(transactionId: string): Promise<TransferResponse> {
    const tx = await transactionRepository.findById(transactionId);
    if (!tx) {
      throw new TransferError('Transaction not found', 'TRANSACTION_NOT_FOUND');
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
        debitAccount: {
          accountNo: debitAccountNo,
          balanceBefore: parseFloat(tx.get('debitBalanceBefore') as string),
          balanceAfter: parseFloat(tx.get('debitBalanceAfter') as string),
        },
        creditAccount: {
          accountNo: creditAccountNo,
          balanceBefore: parseFloat(tx.get('creditBalanceBefore') as string),
          balanceAfter: parseFloat(tx.get('creditBalanceAfter') as string),
        },
        amount: parseFloat(txAmount),
        createdAt: tx.get('createdAt') as Date,
      };
    }

    // Fallback to ledger entries for older transactions
    const entries = await ledgerEntryRepository.findByTransactionId(transactionId);
    const debitEntry = entries.find(
      (e) => e.get('entryType') === EntryType.DEBIT
    );
    const creditEntry = entries.find(
      (e) => e.get('entryType') === EntryType.CREDIT
    );

    if (!debitEntry || !creditEntry) {
      throw new TransferError('Invalid transaction state', 'INVALID_TRANSACTION');
    }

    return {
      transactionId,
      reference: tx.get('reference') as string,
      status: tx.get('status') as string,
      debitAccount: {
        accountNo: debitEntry.get('accountNo') as string,
        balanceBefore: parseFloat(debitEntry.get('balanceBefore') as string),
        balanceAfter: parseFloat(debitEntry.get('balanceAfter') as string),
      },
      creditAccount: {
        accountNo: creditEntry.get('accountNo') as string,
        balanceBefore: parseFloat(creditEntry.get('balanceBefore') as string),
        balanceAfter: parseFloat(creditEntry.get('balanceAfter') as string),
      },
      amount: parseFloat(debitEntry.get('amount') as string),
      createdAt: tx.get('createdAt') as Date,
    };
  },

  async getTransaction(transactionId: string) {
    return transactionRepository.findById(transactionId);
  },

  async getTransactionByIdempotencyKey(idempotencyKey: string) {
    return transactionRepository.findByIdempotencyKey(idempotencyKey);
  },

  async getLedgerEntries(transactionId: string) {
    return ledgerEntryRepository.findByTransactionId(transactionId);
  },

  async getAccountLedger(accountNo: string, limit?: number) {
    return ledgerEntryRepository.findByAccountNo(accountNo, limit);
  },

  async getAccountTransactions(accountNo: string, limit?: number) {
    return transactionRepository.findByAccountNo(accountNo, limit);
  },
};
