import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`${err.message} - ${req.method} ${req.path}`);

  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
    data: null,
  });
};
