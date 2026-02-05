import { Request, Response, NextFunction } from 'express';
import { userController } from '../../controllers/userController';
import { createTestUser } from '../factories';

// Mock sendResponse utility
jest.mock('../../utils/response', () => ({
  sendResponse: jest.fn((res, status, message, data) => {
    res.status(status).json({ success: status < 400, message, data });
  }),
}));

describe('UserController', () => {
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
    it('should return all users', async () => {
      await createTestUser();
      await createTestUser();

      await userController.getAll(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Users retrieved successfully',
        })
      );
    });
  });

  describe('getById', () => {
    it('should return user by id', async () => {
      const user = await createTestUser();
      const userId = user.get('id') as string;

      mockRequest.params = { id: userId };

      await userController.getById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'User retrieved successfully',
        })
      );
    });

    it('should return 404 for non-existent user', async () => {
      mockRequest.params = { id: '00000000-0000-0000-0000-000000000000' };

      await userController.getById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'User not found',
        })
      );
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      mockRequest.body = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      await userController.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'User created successfully',
        })
      );
    });

    it('should handle validation errors', async () => {
      mockRequest.body = {
        name: 'Jane Doe',
        email: 'invalid-email', // Invalid email format
      };

      await userController.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Validation error should be passed to next middleware
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('update', () => {
    it('should update an existing user', async () => {
      const user = await createTestUser();
      const userId = user.get('id') as string;

      mockRequest.params = { id: userId };
      mockRequest.body = { name: 'Updated Name' };

      await userController.update(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'User updated successfully',
        })
      );
    });

    it('should return 404 for non-existent user', async () => {
      mockRequest.params = { id: '00000000-0000-0000-0000-000000000000' };
      mockRequest.body = { name: 'Updated Name' };

      await userController.update(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'User not found',
        })
      );
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      const user = await createTestUser();
      const userId = user.get('id') as string;

      mockRequest.params = { id: userId };

      await userController.delete(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'User deleted successfully',
        })
      );
    });

    it('should return 404 for non-existent user', async () => {
      mockRequest.params = { id: '00000000-0000-0000-0000-000000000000' };

      await userController.delete(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'User not found',
        })
      );
    });
  });
});
