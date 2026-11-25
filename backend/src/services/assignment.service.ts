import { uuidv4 } from '../utils/id.utils.js';
import { dbStore, AssignmentEntity } from '../repositories/store.js';
import { AppError } from '../middleware/error.middleware.js';

export class AssignmentService {
  static async getAllAssignments() {
    return dbStore.assignments.map((a) => {
      const user = dbStore.users.find((u) => u.id === a.userId);
      const intersection = dbStore.intersections.find((i) => i.id === a.intersectionId);
      return {
        ...a,
        officer: user
          ? { id: user.id, fullName: user.fullName, username: user.username, email: user.email }
          : null,
        intersection: intersection
          ? { id: intersection.id, name: intersection.name, code: intersection.code, city: intersection.city }
          : null,
      };
    });
  }

  static async createAssignment(data: { userId: string; intersectionId: string }, adminUserId: string) {
    const user = dbStore.users.find((u) => u.id === data.userId);
    if (!user) throw new AppError('Officer not found', 404, 'USER_NOT_FOUND');

    const intersection = dbStore.intersections.find((i) => i.id === data.intersectionId);
    if (!intersection) throw new AppError('Intersection not found', 404, 'INTERSECTION_NOT_FOUND');

    const existing = dbStore.assignments.find(
      (a) => a.userId === data.userId && a.intersectionId === data.intersectionId && a.status === 'ACTIVE'
    );
    if (existing) {
      throw new AppError('Officer is already actively assigned to this intersection.', 409, 'ALREADY_ASSIGNED');
    }

    const newAssignment: AssignmentEntity = {
      id: uuidv4(),
      userId: data.userId,
      intersectionId: data.intersectionId,
      assignedAt: new Date(),
      status: 'ACTIVE',
      assignedBy: 'Administrator',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dbStore.assignments.push(newAssignment);

    // Create Notification for the assigned officer
    dbStore.notifications.unshift({
      id: uuidv4(),
      userId: user.id,
      title: 'New Intersection Assigned',
      message: `You have been assigned to patrol and monitor ${intersection.name} (${intersection.code}).`,
      category: 'ASSIGNMENT',
      severity: 'INFO',
      linkUrl: `/assigned-intersections`,
      isRead: false,
      createdAt: new Date(),
    });

    // Audit log
    dbStore.auditLogs.unshift({
      id: uuidv4(),
      userId: adminUserId,
      userRole: 'ADMIN',
      action: 'ASSIGN_OFFICER_TO_INTERSECTION',
      entityType: 'IntersectionAssignment',
      entityId: newAssignment.id,
      newValues: { officer: user.username, intersection: intersection.code },
      createdAt: new Date(),
    });

    return newAssignment;
  }

  static async removeAssignment(assignmentId: string, adminUserId: string) {
    const assignment = dbStore.assignments.find((a) => a.id === assignmentId);
    if (!assignment) throw new AppError('Assignment not found', 404, 'ASSIGNMENT_NOT_FOUND');

    assignment.status = 'INACTIVE';
    assignment.unassignedAt = new Date();
    assignment.updatedAt = new Date();

    dbStore.auditLogs.unshift({
      id: uuidv4(),
      userId: adminUserId,
      userRole: 'ADMIN',
      action: 'REMOVE_OFFICER_ASSIGNMENT',
      entityType: 'IntersectionAssignment',
      entityId: assignment.id,
      createdAt: new Date(),
    });

    return { message: 'Assignment removed successfully.' };
  }
}
