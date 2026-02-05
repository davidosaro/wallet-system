import { fundingService, FundingError } from '../../services/fundingService';
import {
  createTestUser,
  createTestWallet,
  createTestPoolAccount,
} from '../factories.mock';

describe('FundingService', () => {
  describe('fundAccount', () => {
    it('should successfully fund an account from pool', async () => {
      const user = await createTestUser();
      const wallet = await createTestWallet(user.get('id') as string);
      const pool = await createTestPoolAccount({ initialBalance: 1000000 });

      const accountNo = wallet.get('accountNo') as string;
      const sourceAccountNo = pool.get('accountNo') as string;

      const result = await fundingService.fundAccount({
        accountNo,
        amount: 50000,
        sourceAccountNo,
      });

      expect(result.status).toBe('COMPLETED');
      expect(result.amount).toBe(50000);
      expect(result.destinationAccount.balanceAfter).toBe(50000);
      expect(result.sourceAccount.balanceAfter).toBe(950000);
    });

    it('should throw error for invalid amount (zero)', async () => {
      const user = await createTestUser();
      const wallet = await createTestWallet(user.get('id') as string);
      const pool = await createTestPoolAccount();

      const accountNo = wallet.get('accountNo') as string;
      const sourceAccountNo = pool.get('accountNo') as string;

      await expect(
        fundingService.fundAccount({
          accountNo,
          amount: 0,
          sourceAccountNo,
        })
      ).rejects.toMatchObject({
        code: 'INVALID_AMOUNT',
        message: 'Amount must be greater than zero',
      });
    });

    it('should throw error for negative amount', async () => {
      const user = await createTestUser();
      const wallet = await createTestWallet(user.get('id') as string);
      const pool = await createTestPoolAccount();

      const accountNo = wallet.get('accountNo') as string;
      const sourceAccountNo = pool.get('accountNo') as string;

      await expect(
        fundingService.fundAccount({
          accountNo,
          amount: -1000,
          sourceAccountNo,
        })
      ).rejects.toMatchObject({
        code: 'INVALID_AMOUNT',
      });
    });

    it('should throw error when source and destination are the same', async () => {
      const user = await createTestUser();
      const wallet = await createTestWallet(user.get('id') as string);

      const accountNo = wallet.get('accountNo') as string;

      await expect(
        fundingService.fundAccount({
          accountNo,
          amount: 1000,
          sourceAccountNo: accountNo,
        })
      ).rejects.toMatchObject({
        code: 'SAME_ACCOUNT',
      });
    });

    it('should throw error for non-existent source account', async () => {
      const user = await createTestUser();
      const wallet = await createTestWallet(user.get('id') as string);

      const accountNo = wallet.get('accountNo') as string;

      await expect(
        fundingService.fundAccount({
          accountNo,
          amount: 1000,
          sourceAccountNo: 'ACC-NONEXISTENT-001',
        })
      ).rejects.toMatchObject({
        code: 'SOURCE_ACCOUNT_NOT_FOUND',
      });
    });

    it('should throw error for non-existent destination account', async () => {
      const pool = await createTestPoolAccount();
      const sourceAccountNo = pool.get('accountNo') as string;

      await expect(
        fundingService.fundAccount({
          accountNo: 'ACC-NONEXISTENT-002',
          amount: 1000,
          sourceAccountNo,
        })
      ).rejects.toMatchObject({
        code: 'DESTINATION_ACCOUNT_NOT_FOUND',
      });
    });

    it('should throw error for currency mismatch', async () => {
      const user = await createTestUser();
      const wallet = await createTestWallet(user.get('id') as string, {
        currency: 'USD',
      });
      const pool = await createTestPoolAccount({ currency: 'NGN' });

      const accountNo = wallet.get('accountNo') as string;
      const sourceAccountNo = pool.get('accountNo') as string;

      await expect(
        fundingService.fundAccount({
          accountNo,
          amount: 1000,
          sourceAccountNo,
        })
      ).rejects.toMatchObject({
        code: 'CURRENCY_MISMATCH',
      });
    });

    it('should handle idempotency', async () => {
      const user = await createTestUser();
      const wallet = await createTestWallet(user.get('id') as string);
      const pool = await createTestPoolAccount({ initialBalance: 1000000 });

      const accountNo = wallet.get('accountNo') as string;
      const sourceAccountNo = pool.get('accountNo') as string;
      const idempotencyKey = 'test-funding-123';

      // First funding
      const result1 = await fundingService.fundAccount(
        {
          accountNo,
          amount: 50000,
          sourceAccountNo,
        },
        idempotencyKey
      );

      // Second funding with same idempotency key
      const result2 = await fundingService.fundAccount(
        {
          accountNo,
          amount: 50000,
          sourceAccountNo,
        },
        idempotencyKey
      );

      expect(result1.transactionId).toBe(result2.transactionId);
      expect(result2.destinationAccount.balanceAfter).toBe(50000); // Only funded once
    });

    it('should sync wallet balance after funding', async () => {
      const user = await createTestUser();
      const wallet = await createTestWallet(user.get('id') as string);
      const pool = await createTestPoolAccount({ initialBalance: 1000000 });

      const accountNo = wallet.get('accountNo') as string;
      const sourceAccountNo = pool.get('accountNo') as string;

      await fundingService.fundAccount({
        accountNo,
        amount: 50000,
        sourceAccountNo,
      });

      const reloadedWallet = await wallet.reload();
      expect(parseFloat(reloadedWallet.get('balance') as string)).toBe(50000);
    });
  });

  describe('fundWallet', () => {
    it('should successfully fund a wallet from pool', async () => {
      const user = await createTestUser();
      const wallet = await createTestWallet(user.get('id') as string);
      const pool = await createTestPoolAccount({ initialBalance: 1000000 });

      const walletId = wallet.get('id') as string;
      const sourceAccountNo = pool.get('accountNo') as string;

      const result = await fundingService.fundWallet({
        walletId,
        amount: 75000,
        sourceAccountNo,
      });

      expect(result.status).toBe('COMPLETED');
      expect(result.amount).toBe(75000);
      expect(result.destinationAccount.balanceAfter).toBe(75000);
    });

    it('should throw error for non-existent wallet', async () => {
      const pool = await createTestPoolAccount();
      const sourceAccountNo = pool.get('accountNo') as string;

      await expect(
        fundingService.fundWallet({
          walletId: '00000000-0000-0000-0000-000000000000',
          amount: 1000,
          sourceAccountNo,
        })
      ).rejects.toMatchObject({
        code: 'WALLET_NOT_FOUND',
      });
    });

    it('should throw error for wallet without account', async () => {
      const user = await createTestUser();
      // Create wallet manually without account
      const { Wallet } = require('../../models/Wallet');
      const wallet = await Wallet.create({
        userId: user.get('id'),
        currency: 'NGN',
        balance: 0,
      });

      const pool = await createTestPoolAccount();
      const walletId = wallet.get('id') as string;
      const sourceAccountNo = pool.get('accountNo') as string;

      await expect(
        fundingService.fundWallet({
          walletId,
          amount: 1000,
          sourceAccountNo,
        })
      ).rejects.toMatchObject({
        code: 'NO_ACCOUNT',
      });
    });
  });
});
