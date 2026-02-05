import { transferService, TransferError } from '../../services/transferService';
import { createTestUser, createTestWallet } from '../factories.mock';

describe('TransferService', () => {
  describe('transfer', () => {
    it('should successfully transfer funds between accounts', async () => {
      // Create two users with wallets
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const wallet1 = await createTestWallet(user1.get('id') as string, {
        initialBalance: 10000,
      });
      const wallet2 = await createTestWallet(user2.get('id') as string, {
        initialBalance: 5000,
      });

      const fromAccountNo = wallet1.get('accountNo') as string;
      const toAccountNo = wallet2.get('accountNo') as string;

      // Perform transfer
      const result = await transferService.transfer({
        debitAccountNo: fromAccountNo,
        creditAccountNo: toAccountNo,
        amount: 3000,
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('COMPLETED');
      expect(result.amount).toBe(3000);
      expect(result.debitAccount.balanceBefore).toBe(10000);
      expect(result.debitAccount.balanceAfter).toBe(7000);
      expect(result.creditAccount.balanceBefore).toBe(5000);
      expect(result.creditAccount.balanceAfter).toBe(8000);
    });

    it('should throw error for insufficient funds', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const wallet1 = await createTestWallet(user1.get('id') as string, {
        initialBalance: 1000,
      });
      const wallet2 = await createTestWallet(user2.get('id') as string);

      const fromAccountNo = wallet1.get('accountNo') as string;
      const toAccountNo = wallet2.get('accountNo') as string;

      await expect(
        transferService.transfer({
          debitAccountNo: fromAccountNo,
          creditAccountNo: toAccountNo,
          amount: 2000,
        })
      ).rejects.toThrow(TransferError);

      await expect(
        transferService.transfer({
          debitAccountNo: fromAccountNo,
          creditAccountNo: toAccountNo,
          amount: 2000,
        })
      ).rejects.toMatchObject({
        code: 'INSUFFICIENT_FUNDS',
      });
    });

    it('should throw error for invalid amount (zero)', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const wallet1 = await createTestWallet(user1.get('id') as string, {
        initialBalance: 10000,
      });
      const wallet2 = await createTestWallet(user2.get('id') as string);

      const fromAccountNo = wallet1.get('accountNo') as string;
      const toAccountNo = wallet2.get('accountNo') as string;

      await expect(
        transferService.transfer({
          debitAccountNo: fromAccountNo,
          creditAccountNo: toAccountNo,
          amount: 0,
        })
      ).rejects.toMatchObject({
        code: 'INVALID_AMOUNT',
        message: 'Amount must be greater than zero',
      });
    });

    it('should throw error for negative amount', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const wallet1 = await createTestWallet(user1.get('id') as string, {
        initialBalance: 10000,
      });
      const wallet2 = await createTestWallet(user2.get('id') as string);

      const fromAccountNo = wallet1.get('accountNo') as string;
      const toAccountNo = wallet2.get('accountNo') as string;

      await expect(
        transferService.transfer({
          debitAccountNo: fromAccountNo,
          creditAccountNo: toAccountNo,
          amount: -500,
        })
      ).rejects.toMatchObject({
        code: 'INVALID_AMOUNT',
      });
    });

    it('should throw error when transferring to same account', async () => {
      const user = await createTestUser();
      const wallet = await createTestWallet(user.get('id') as string, {
        initialBalance: 10000,
      });

      const accountNo = wallet.get('accountNo') as string;

      await expect(
        transferService.transfer({
          debitAccountNo: accountNo,
          creditAccountNo: accountNo,
          amount: 1000,
        })
      ).rejects.toMatchObject({
        code: 'SAME_ACCOUNT',
      });
    });

    it('should throw error for non-existent debit account', async () => {
      const user = await createTestUser();
      const wallet = await createTestWallet(user.get('id') as string);
      const toAccountNo = wallet.get('accountNo') as string;

      await expect(
        transferService.transfer({
          debitAccountNo: 'ACC-NONEXISTENT-001',
          creditAccountNo: toAccountNo,
          amount: 1000,
        })
      ).rejects.toMatchObject({
        code: 'DEBIT_ACCOUNT_NOT_FOUND',
      });
    });

    it('should throw error for non-existent credit account', async () => {
      const user = await createTestUser();
      const wallet = await createTestWallet(user.get('id') as string, {
        initialBalance: 10000,
      });
      const fromAccountNo = wallet.get('accountNo') as string;

      await expect(
        transferService.transfer({
          debitAccountNo: fromAccountNo,
          creditAccountNo: 'ACC-NONEXISTENT-002',
          amount: 1000,
        })
      ).rejects.toMatchObject({
        code: 'CREDIT_ACCOUNT_NOT_FOUND',
      });
    });

    it('should throw error for currency mismatch', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const wallet1 = await createTestWallet(user1.get('id') as string, {
        currency: 'NGN',
        initialBalance: 10000,
      });
      const wallet2 = await createTestWallet(user2.get('id') as string, {
        currency: 'USD',
      });

      const fromAccountNo = wallet1.get('accountNo') as string;
      const toAccountNo = wallet2.get('accountNo') as string;

      await expect(
        transferService.transfer({
          debitAccountNo: fromAccountNo,
          creditAccountNo: toAccountNo,
          amount: 1000,
        })
      ).rejects.toMatchObject({
        code: 'CURRENCY_MISMATCH',
      });
    });

    it('should handle idempotency - return existing transaction for same key', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const wallet1 = await createTestWallet(user1.get('id') as string, {
        initialBalance: 10000,
      });
      const wallet2 = await createTestWallet(user2.get('id') as string);

      const fromAccountNo = wallet1.get('accountNo') as string;
      const toAccountNo = wallet2.get('accountNo') as string;
      const idempotencyKey = 'test-transfer-123';

      // First transfer
      const result1 = await transferService.transfer(
        {
          debitAccountNo: fromAccountNo,
          creditAccountNo: toAccountNo,
          amount: 3000,
        },
        idempotencyKey
      );

      // Second transfer with same idempotency key should return same result
      const result2 = await transferService.transfer(
        {
          debitAccountNo: fromAccountNo,
          creditAccountNo: toAccountNo,
          amount: 3000,
        },
        idempotencyKey
      );

      expect(result1.transactionId).toBe(result2.transactionId);
      expect(result1.reference).toBe(result2.reference);

      // Balance should only be deducted once
      expect(result2.debitAccount.balanceAfter).toBe(7000);
    });

    it('should sync wallet balances after transfer', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const wallet1 = await createTestWallet(user1.get('id') as string, {
        initialBalance: 10000,
      });
      const wallet2 = await createTestWallet(user2.get('id') as string, {
        initialBalance: 5000,
      });

      const fromAccountNo = wallet1.get('accountNo') as string;
      const toAccountNo = wallet2.get('accountNo') as string;

      await transferService.transfer({
        debitAccountNo: fromAccountNo,
        creditAccountNo: toAccountNo,
        amount: 3000,
      });

      // Reload wallets and check balances
      const reloadedWallet1 = await wallet1.reload();
      const reloadedWallet2 = await wallet2.reload();

      expect(parseFloat(reloadedWallet1.get('balance') as string)).toBe(7000);
      expect(parseFloat(reloadedWallet2.get('balance') as string)).toBe(8000);
    });

    it('should accept metadata in transaction', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const wallet1 = await createTestWallet(user1.get('id') as string, {
        initialBalance: 10000,
      });
      const wallet2 = await createTestWallet(user2.get('id') as string);

      const fromAccountNo = wallet1.get('accountNo') as string;
      const toAccountNo = wallet2.get('accountNo') as string;

      const result = await transferService.transfer({
        debitAccountNo: fromAccountNo,
        creditAccountNo: toAccountNo,
        amount: 3000,
        metadata: { note: 'Payment for services', invoiceId: 'INV-001' },
      });

      expect(result.status).toBe('COMPLETED');
      expect(result.amount).toBe(3000);
    });
  });
});
