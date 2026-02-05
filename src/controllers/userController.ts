import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService';
import { sendResponse } from '../utils/response';

export const userController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await userService.getAll();
      sendResponse(res, 200, 'Users retrieved successfully', users);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.getById(parseInt(req.params.id));
      if (!user) {
        return sendResponse(res, 404, 'User not found');
      }
      sendResponse(res, 200, 'User retrieved successfully', user);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.create(req.body);
      sendResponse(res, 201, 'User created successfully', user);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.update(parseInt(req.params.id), req.body);
      if (!user) {
        return sendResponse(res, 404, 'User not found');
      }
      sendResponse(res, 200, 'User updated successfully', user);
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const deleted = await userService.delete(parseInt(req.params.id));
      if (!deleted) {
        return sendResponse(res, 404, 'User not found');
      }
      sendResponse(res, 204, 'User deleted successfully');
    } catch (err) {
      next(err);
    }
  },
};
