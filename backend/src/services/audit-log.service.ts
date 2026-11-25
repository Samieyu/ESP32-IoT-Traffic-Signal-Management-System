import { dbStore } from '../repositories/store.js';

export class AuditLogService {
  static async getAuditLogs(filters?: { action?: string; userId?: string; entityType?: string }) {
    let logs = [...dbStore.auditLogs];

    if (filters?.action) {
      logs = logs.filter((l) => l.action.includes(filters.action!));
    }
    if (filters?.userId) {
      logs = logs.filter((l) => l.userId === filters.userId);
    }
    if (filters?.entityType) {
      logs = logs.filter((l) => l.entityType === filters.entityType);
    }

    return logs.map((l) => {
      const u = l.userId ? dbStore.users.find((user) => user.id === l.userId) : null;
      return {
        ...l,
        userFullName: u ? u.fullName : 'System',
        username: u ? u.username : 'system',
      };
    });
  }
}
