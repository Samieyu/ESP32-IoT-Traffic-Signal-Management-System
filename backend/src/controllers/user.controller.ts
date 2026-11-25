import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service.js';
import { createUserSchema, updateUserSchema, updateUserStatusSchema } from '../validators/user.validator.js';

export class UserController {
  static async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { role, status, search } = req.query;
      const users = await UserService.getAllUsers({
        role: role as string,
        status: status as string,
        search: search as string,
      });

      return res.status(200).json({
        success: true,
        data: users,
        total: users.length,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserService.getUserById(req.params.id);
      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createUserSchema.parse(req.body);
      const user = await UserService.createUser(validated, req.user!.userId);
      return res.status(201).json({
        success: true,
        message: 'Traffic Police account created successfully.',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateUserSchema.parse(req.body);
      const user = await UserService.updateUser(req.params.id, validated, req.user!.userId);
      return res.status(200).json({
        success: true,
        message: 'Account updated successfully.',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateUserStatusSchema.parse(req.body);
      const user = await UserService.updateUserStatus(req.params.id, validated.status, req.user!.userId);
      return res.status(200).json({
        success: true,
        message: `Account status set to ${validated.status}.`,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UserService.deleteUser(req.params.id, req.user!.userId);
      return res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
