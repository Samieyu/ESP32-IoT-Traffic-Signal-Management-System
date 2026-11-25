import bcrypt from 'bcryptjs';
import { uuidv4 } from '../utils/id.utils.js';
import { dbStore, UserEntity } from '../repositories/store.js';
import { AppError } from '../middleware/error.middleware.js';

export class UserService {
  static async getAllUsers(filters?: { role?: string; status?: string; search?: string }) {
    let users = [...dbStore.users];

    if (filters?.role) {
      users = users.filter((u) => u.role === filters.role);
    }
    if (filters?.status) {
      users = users.filter((u) => u.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      users = users.filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }

    return users.map((u) => {
      const { passwordHash, ...sanitized } = u;
      const assignments = dbStore.assignments
        .filter((a) => a.userId === u.id && a.status === 'ACTIVE')
        .map((a) => {
          const inter = dbStore.intersections.find((i) => i.id === a.intersectionId);
          return {
            id: a.id,
            intersectionId: a.intersectionId,
            intersectionName: inter ? inter.name : 'Unknown',
            intersectionCode: inter ? inter.code : 'UNKNOWN',
            assignedAt: a.assignedAt,
          };
        });
      return {
        ...sanitized,
        assignments,
      };
    });
  }

  static async getUserById(id: string) {
    const user = dbStore.users.find((u) => u.id === id);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    const { passwordHash, ...sanitized } = user;
    const assignments = dbStore.assignments
      .filter((a) => a.userId === user.id && a.status === 'ACTIVE')
      .map((a) => {
        const inter = dbStore.intersections.find((i) => i.id === a.intersectionId);
        return {
          id: a.id,
          intersectionId: a.intersectionId,
          intersectionName: inter ? inter.name : 'Unknown',
          intersectionCode: inter ? inter.code : 'UNKNOWN',
          assignedAt: a.assignedAt,
        };
      });

    // Operational record counts
    const incidentCount = dbStore.incidents.filter((i) => i.reportedById === user.id).length;
    const problemCount = dbStore.problemReports.filter((p) => p.reportedById === user.id).length;
    const emergencyCount = dbStore.emergencyOperations.filter((e) => e.officerId === user.id).length;

    return {
      ...sanitized,
      assignments,
      stats: {
        totalIncidentsReported: incidentCount,
        totalProblemsReported: problemCount,
        totalEmergencyInterventions: emergencyCount,
      },
    };
  }

  static async createUser(data: {
    email: string;
    username: string;
    password: string;
    fullName: string;
    phoneNumber?: string | null;
    role?: 'ADMIN' | 'TRAFFIC_POLICE';
    assignedIntersectionIds?: string[];
  }, adminUserId: string) {
    // Check duplicates
    const existing = dbStore.users.find(
      (u) =>
        u.email.toLowerCase() === data.email.toLowerCase() ||
        u.username.toLowerCase() === data.username.toLowerCase()
    );
    if (existing) {
      throw new AppError('A user with that email or username already exists.', 409, 'USER_ALREADY_EXISTS');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const newUserId = uuidv4();

    const newUser: UserEntity = {
      id: newUserId,
      email: data.email.trim(),
      username: data.username.trim(),
      passwordHash,
      fullName: data.fullName.trim(),
      phoneNumber: data.phoneNumber || null,
      role: data.role || 'TRAFFIC_POLICE',
      status: 'ACTIVE',
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dbStore.users.push(newUser);

    // Assign intersections if provided
    if (data.assignedIntersectionIds && data.assignedIntersectionIds.length > 0) {
      for (const interId of data.assignedIntersectionIds) {
        dbStore.assignments.push({
          id: uuidv4(),
          userId: newUserId,
          intersectionId: interId,
          assignedAt: new Date(),
          status: 'ACTIVE',
          assignedBy: 'Administrator',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    // Audit log
    dbStore.auditLogs.unshift({
      id: uuidv4(),
      userId: adminUserId,
      userRole: 'ADMIN',
      action: 'CREATE_OFFICER_ACCOUNT',
      entityType: 'User',
      entityId: newUserId,
      newValues: { username: newUser.username, role: newUser.role, fullName: newUser.fullName },
      createdAt: new Date(),
    });

    const { passwordHash: _, ...sanitized } = newUser;
    return sanitized;
  }

  static async updateUser(id: string, data: any, adminUserId: string) {
    const user = dbStore.users.find((u) => u.id === id);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const previousValues = { fullName: user.fullName, phoneNumber: user.phoneNumber, email: user.email };

    if (data.fullName) user.fullName = data.fullName.trim();
    if (data.phoneNumber !== undefined) user.phoneNumber = data.phoneNumber;
    if (data.email) user.email = data.email.trim();
    if (data.password) {
      user.passwordHash = await bcrypt.hash(data.password, 10);
    }

    if (data.assignedIntersectionIds) {
      // Update assignments: mark old ones inactive, add new ones
      for (const asg of dbStore.assignments) {
        if (asg.userId === user.id) {
          asg.status = 'INACTIVE';
          asg.unassignedAt = new Date();
        }
      }
      for (const interId of data.assignedIntersectionIds) {
        dbStore.assignments.push({
          id: uuidv4(),
          userId: user.id,
          intersectionId: interId,
          assignedAt: new Date(),
          status: 'ACTIVE',
          assignedBy: 'Administrator',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    user.updatedAt = new Date();

    dbStore.auditLogs.unshift({
      id: uuidv4(),
      userId: adminUserId,
      userRole: 'ADMIN',
      action: 'UPDATE_OFFICER_ACCOUNT',
      entityType: 'User',
      entityId: user.id,
      previousValues,
      newValues: data,
      createdAt: new Date(),
    });

    const { passwordHash: _, ...sanitized } = user;
    return sanitized;
  }

  static async updateUserStatus(id: string, status: 'ACTIVE' | 'INACTIVE', adminUserId: string) {
    const user = dbStore.users.find((u) => u.id === id);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const previousStatus = user.status;
    user.status = status;
    user.updatedAt = new Date();

    dbStore.auditLogs.unshift({
      id: uuidv4(),
      userId: adminUserId,
      userRole: 'ADMIN',
      action: status === 'ACTIVE' ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
      entityType: 'User',
      entityId: user.id,
      previousValues: { status: previousStatus },
      newValues: { status },
      createdAt: new Date(),
    });

    return { id: user.id, status: user.status };
  }

  static async deleteUser(id: string, adminUserId: string) {
    const userIndex = dbStore.users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const user = dbStore.users[userIndex];

    // Preserving Historical Information (FR-2 requirement)
    // Check if user has associated operational records
    const hasIncidents = dbStore.incidents.some((i) => i.reportedById === id);
    const hasProblems = dbStore.problemReports.some((p) => p.reportedById === id);
    const hasEmergency = dbStore.emergencyOperations.some((e) => e.officerId === id);

    if (hasIncidents || hasProblems || hasEmergency) {
      // Deactivate instead of deleting to preserve audit and operational integrity
      user.status = 'INACTIVE';
      user.updatedAt = new Date();

      dbStore.auditLogs.unshift({
        id: uuidv4(),
        userId: adminUserId,
        userRole: 'ADMIN',
        action: 'DEACTIVATE_OFFICER_PRESERVE_HISTORY',
        entityType: 'User',
        entityId: user.id,
        newValues: { status: 'INACTIVE', reason: 'Associated operational records present' },
        createdAt: new Date(),
      });

      return {
        message: 'Account has associated operational records and was deactivated instead of permanently deleted to preserve historical data.',
        deactivated: true,
      };
    }

    // If no operational records exist, allow permanent deletion
    dbStore.users.splice(userIndex, 1);
    // Remove assignments
    dbStore.assignments = dbStore.assignments.filter((a) => a.userId !== id);

    dbStore.auditLogs.unshift({
      id: uuidv4(),
      userId: adminUserId,
      userRole: 'ADMIN',
      action: 'DELETE_USER_PERMANENT',
      entityType: 'User',
      entityId: id,
      createdAt: new Date(),
    });

    return {
      message: 'User account deleted successfully.',
      deactivated: false,
    };
  }
}
