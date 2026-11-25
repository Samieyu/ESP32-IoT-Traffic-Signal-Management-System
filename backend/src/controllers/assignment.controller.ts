import { Request, Response, NextFunction } from 'express';
import { AssignmentService } from '../services/assignment.service.js';

export class AssignmentController {
  static async getAllAssignments(req: Request, res: Response, next: NextFunction) {
    try {
      const assignments = await AssignmentService.getAllAssignments();
      return res.status(200).json({ success: true, data: assignments });
    } catch (error) {
      next(error);
    }
  }

  static async createAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, intersectionId } = req.body;
      const assignment = await AssignmentService.createAssignment({ userId, intersectionId }, req.user!.userId);
      return res.status(201).json({ success: true, message: 'Officer assigned successfully.', data: assignment });
    } catch (error) {
      next(error);
    }
  }

  static async removeAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AssignmentService.removeAssignment(req.params.id, req.user!.userId);
      return res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      next(error);
    }
  }
}
