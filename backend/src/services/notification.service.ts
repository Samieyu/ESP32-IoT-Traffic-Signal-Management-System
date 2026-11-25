import { uuidv4 } from '../utils/id.utils.js';
import { dbStore, NotificationEntity } from '../repositories/store.js';
import { AppError } from '../middleware/error.middleware.js';

export class NotificationService {
  static async getUserNotifications(userId: string) {
    const list = dbStore.notifications.filter((n) => n.userId === userId);
    const unreadCount = list.filter((n) => !n.isRead).length;
    return {
      notifications: list,
      unreadCount,
    };
  }

  static async markAsRead(notificationId: string, userId: string) {
    const item = dbStore.notifications.find((n) => n.id === notificationId && n.userId === userId);
    if (!item) {
      throw new AppError('Notification not found', 404, 'NOT_FOUND');
    }
    item.isRead = true;
    item.readAt = new Date();
    return item;
  }

  static async markAllAsRead(userId: string) {
    for (const notif of dbStore.notifications) {
      if (notif.userId === userId && !notif.isRead) {
        notif.isRead = true;
        notif.readAt = new Date();
      }
    }
    return { message: 'All notifications marked as read.' };
  }
}
