import { Request, Response, NextFunction } from 'express';
import { walletController } from '../../controllers/walletController';
import { walletService, WalletError } from '../../services/walletService';
import { createTestUser, createTestWallet } from '../factories.mock';

// Mock sendResponse utility
jest.mock('../../utils/response', () => ({
  sendResponse: jest.fn((res, status, message, data) => {
    res.status(status).json({ success: status < 400, message, data });
  }),
}));

describe('WalletController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      params: {},
      body: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('getAll', () => {
    it('should return all wallets', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      await createTestWallet(user1.get('id') as string);
      await createTestWallet(user2.get('id') as string);

      await walletController.getAll(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Wallets retrieved successfully',
        })
      );
    });

    it('should call next on error', async () => {
      jest.spyOn(walletService, 'getAll').mockRejectedValue(new Error('DB error'));

      await walletController.getAll(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));

      // Restore mock
      jest.restoreAllMocks();
    });
  });

  describe('getById', () => {
    it('should return wallet by id', async () => {
      const user = await createTestUser();
      const wallet = await createTestWallet(user.get('id') as string);
      const walletId = wallet.get('id') as string;

      mockRequest.params = { id: walletId };

      await walletController.getById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Wallet retrieved successfully',
        })
      );
    });

    it('should return 404 for non-existent wallet', async () => {
      mockRequest.params = { id: '00000000-0000-0000-0000-000000000000' };

      await walletController.getById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Wallet not found',
        })
      );
    });
  });

  describe('create', () => {
    it('should create a new wallet', async () => {
      const user = await createTestUser();
      mockRequest.body = { userId: user.get('id') };

      await walletController.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Wallet created successfully',
        })
      );
    });

    it('should return 409 when wallet already exists', async () => {
      const user = await createTestUser();
      const userId = user.get('id') as string;

      // Create first wallet
      await createTestWallet(userId);

      // Try to create second wallet
      mockRequest.body = { userId, currency: 'NGN' };

      await walletController.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'User already has a wallet in NGN',
          data: { code: 'WALLET_ALREADY_EXISTS' },
        })
      );
    });

    it('should call next for non-WalletError errors', async () => {
      const user = await createTestUser();
      mockRequest.body = { userId: user.get('id') };

      jest
        .spyOn(walletService, 'create')
        .mockRejectedValue(new Error('Unexpected error'));

      await walletController.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));

      jest.restoreAllMocks();
    });
  });

  describe('delete', () => {
    it('should delete a wallet', async () => {
      const user = await createTestUser();
      const wallet = await createTestWallet(user.get('id') as string);
      const walletId = wallet.get('id') as string;

      mockRequest.params = { id: walletId };

      await walletController.delete(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Wallet deleted successfully',
        })
      );
    });

    it('should return 404 when deleting non-existent wallet', async () => {
      mockRequest.params = { id: '00000000-0000-0000-0000-000000000000' };

      await walletController.delete(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Wallet not found',
        })
      );
    });
  });
});
