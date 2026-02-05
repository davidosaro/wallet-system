import { Request, Response, NextFunction } from 'express';
import {
  ValidationError,
  UniqueConstraintError,
  ForeignKeyConstraintError,
  DatabaseError,
  ValidationErrorItem,
} from 'sequelize';
import { errorHandler } from '../../middleware/errorHandler';

describe('ErrorHandler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      method: 'POST',
      path: '/api/test',
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('ValidationError', () => {
    it('should handle Sequelize ValidationError with 400 status', () => {
      const validationError = new ValidationError('Validation error', [
        new ValidationErrorItem(
          'Must be a valid email address',
          'Validation error',
          'email',
          'invalid-email',
          null as any,
          'isEmail',
          'isEmail',
          []
        ),
      ]);

      errorHandler(
        validationError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: [
          {
            field: 'email',
            message: 'Must be a valid email address',
            value: 'invalid-email',
          },
        ],
        data: null,
      });
    });

    it('should handle multiple validation errors', () => {
      const validationError = new ValidationError('Validation error', [
        new ValidationErrorItem(
          'Email cannot be empty',
          'Validation error',
          'email',
          '',
          null as any,
          'notEmpty',
          'notEmpty',
          []
        ),
        new ValidationErrorItem(
          'Name is required',
          'Validation error',
          'name',
          null,
          null as any,
          'notNull',
          'notNull',
          []
        ),
      ]);

      errorHandler(
        validationError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: [
          {
            field: 'email',
            message: 'Email cannot be empty',
            value: '',
          },
          {
            field: 'name',
            message: 'Name is required',
            value: null,
          },
        ],
        data: null,
      });
    });
  });

  describe('UniqueConstraintError', () => {
    it('should handle Sequelize UniqueConstraintError with 409 status', () => {
      const uniqueError = new UniqueConstraintError({
        errors: [
          new ValidationErrorItem(
            'email must be unique',
            'unique violation',
            'email',
            'test@example.com',
            null as any,
            'unique',
            'unique',
            []
          ),
        ],
        message: 'Unique constraint error',
      });

      errorHandler(
        uniqueError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Duplicate entry',
        errors: [
          {
            field: 'email',
            message: 'email must be unique',
            value: 'test@example.com',
          },
        ],
        data: null,
      });
    });
  });

  describe('ForeignKeyConstraintError', () => {
    it('should handle Sequelize ForeignKeyConstraintError with 400 status', () => {
      const fkError = new ForeignKeyConstraintError({
        message: 'Foreign key constraint error',
      });

      errorHandler(
        fkError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid reference: related record does not exist',
        data: null,
      });
    });
  });

  describe('DatabaseError', () => {
    it('should handle Sequelize DatabaseError with 500 status', () => {
      const dbError = new DatabaseError(new Error('Database connection failed'));

      errorHandler(
        dbError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Database error occurred',
        data: null,
      });
    });
  });

  describe('Generic Error', () => {
    it('should handle generic errors with 500 status', () => {
      const genericError = new Error('Something went wrong');

      errorHandler(
        genericError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Something went wrong',
        data: null,
      });
    });

    it('should handle errors without message', () => {
      const error = new Error();
      error.message = '';

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
        data: null,
      });
    });
  });
});
