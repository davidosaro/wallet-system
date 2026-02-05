import { Request, Response, NextFunction } from 'express';
import {
  ValidationError,
  UniqueConstraintError,
  ForeignKeyConstraintError,
  DatabaseError,
} from 'sequelize';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`${err.message} - ${req.method} ${req.path}`);

  // Sequelize Validation Error (e.g., required fields, format validation)
  if (err instanceof ValidationError) {
    const errors = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
      value: e.value,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors,
      data: null,
    });
  }

  // Sequelize Unique Constraint Error (e.g., duplicate email)
  if (err instanceof UniqueConstraintError) {
    const errors = err.errors.map((e) => ({
      field: e.path,
      message: `${e.path} must be unique`,
      value: e.value,
    }));

    return res.status(409).json({
      success: false,
      message: 'Duplicate entry',
      errors,
      data: null,
    });
  }

  // Sequelize Foreign Key Constraint Error
  if (err instanceof ForeignKeyConstraintError) {
    return res.status(400).json({
      success: false,
      message: 'Invalid reference: related record does not exist',
      data: null,
    });
  }

  // Other Database Errors
  if (err instanceof DatabaseError) {
    logger.error('Database error:', err);
    return res.status(500).json({
      success: false,
      message: 'Database error occurred',
      data: null,
    });
  }

  // Generic error handler
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
    data: null,
  });
};
