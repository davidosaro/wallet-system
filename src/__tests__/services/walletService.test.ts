import { walletService, WalletError } from '../../services/walletService';
import { createTestUser, createTestWallet } from '../factories.mock';

describe('WalletService', () => {
  describe('create', () => {
    it('should create a wallet with default currency (NGN)', async () => {
      const user = await createTestUser();
      const userId = user.get('id') as string;

      const wallet = await walletService.create({ userId });

      expect(wallet).toBeDefined();
      expect(wallet?.get('userId')).toBe(userId);
      expect(wallet?.get('currency')).toBe('NGN');
      expect(wallet?.get('balance')).toBe(0);
      expect(wallet?.get('accountNo')).toBeTruthy();
    });

    it('should create a wallet with specified currency', async () => {
      const user = await createTestUser();
      const userId = user.get('id') as string;

      const wallet = await walletService.create({ userId, currency: 'USD' });

      expect(wallet?.get('currency')).toBe('USD');
    });

    it('should throw error when user tries to create duplicate wallet in same currency', async () => {
      const user = await createTestUser();
      const userId = user.get('id') as string;

      // Create first wallet
      await walletService.create({ userId, currency: 'NGN' });

      // Try to create second wallet in same currency
      await expect(
        walletService.create({ userId, currency: 'NGN' })
      ).rejects.toThrow(WalletError);

      await expect(
        walletService.create({ userId, currency: 'NGN' })
      ).rejects.toMatchObject({
        code: 'WALLET_ALREADY_EXISTS',
        message: 'User already has a wallet in NGN',
      });
    });

    it('should allow user to have multiple wallets in different currencies', async () => {
      const user = await createTestUser();
      const userId = user.get('id') as string;

      const wallet1 = await walletService.create({ userId, currency: 'NGN' });
      const wallet2 = await walletService.create({ userId, currency: 'USD' });

      expect(wallet1?.get('currency')).toBe('NGN');
      expect(wallet2?.get('currency')).toBe('USD');
    });
  });

  describe('getById', () => {
    it('should retrieve wallet by id', async () => {
      const user = await createTestUser();
      const userId = user.get('id') as string;
      const wallet = await walletService.create({ userId });
      const walletId = wallet!.get('id') as string;

      const retrieved = await walletService.getById(walletId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.get('id')).toBe(walletId);
    });

    it('should return null for non-existent wallet', async () => {
      const retrieved = await walletService.getById(
        '00000000-0000-0000-0000-000000000000'
      );

      expect(retrieved).toBeNull();
    });
  });

  describe('getByIdWithAccountBalance', () => {
    it('should retrieve wallet with account balance', async () => {
      const user = await createTestUser();
      const userId = user.get('id') as string;
      const wallet = await createTestWallet(userId, { initialBalance: 5000 });
      const walletId = wallet.get('id') as string;

      const retrieved = await walletService.getByIdWithAccountBalance(walletId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(walletId);
      expect(retrieved?.clearedBalance).toBe(5000);
    });

    it('should return null for non-existent wallet', async () => {
      const retrieved = await walletService.getByIdWithAccountBalance(
        '00000000-0000-0000-0000-000000000000'
      );

      expect(retrieved).toBeNull();
    });
  });

  describe('getByUserId', () => {
    it('should retrieve wallet by user id', async () => {
      const user = await createTestUser();
      const userId = user.get('id') as string;
      await walletService.create({ userId });

      const retrieved = await walletService.getByUserId(userId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.get('userId')).toBe(userId);
    });

    it('should return null for user without wallet', async () => {
      const user = await createTestUser();
      const userId = user.get('id') as string;

      const retrieved = await walletService.getByUserId(userId);

      expect(retrieved).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should retrieve all wallets', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      await walletService.create({ userId: user1.get('id') as string });
      await walletService.create({ userId: user2.get('id') as string });

      const wallets = await walletService.getAll();

      expect(wallets).toHaveLength(2);
    });

    it('should return empty array when no wallets exist', async () => {
      const wallets = await walletService.getAll();

      expect(wallets).toEqual([]);
    });
  });

  describe('delete', () => {
    it('should delete a wallet', async () => {
      const user = await createTestUser();
      const userId = user.get('id') as string;
      const wallet = await walletService.create({ userId });
      const walletId = wallet!.get('id') as string;

      const deleted = await walletService.delete(walletId);

      expect(deleted).toBe(true);

      const retrieved = await walletService.getById(walletId);
      expect(retrieved).toBeNull();
    });

    it('should return false when deleting non-existent wallet', async () => {
      const deleted = await walletService.delete(
        '00000000-0000-0000-0000-000000000000'
      );

      expect(deleted).toBe(false);
    });
  });
});
