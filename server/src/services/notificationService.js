import notificationRepository from '../repositories/notificationRepository.js';
import taskRepository from '../repositories/taskRepository.js';
import { NOTIFICATION_TYPES, TASK_STATUS } from '../constants/index.js';

export const notificationService = {
  async createNotification({ recipient, task, type, message, senderId = null }) {
    if (senderId && String(senderId) === String(recipient)) {
      return null;
    }

    return notificationRepository.create({
      recipient,
      task,
      type,
      message
    });
  },

  async getUserNotifications(userId, limit = 50) {
    const notifications = await notificationRepository.find(
      { recipient: userId },
      null,
      { sort: { createdAt: -1 }, limit }
    );
    const unreadCount = await notificationRepository.count({
      recipient: userId,
      isRead: false
    });
    return { notifications, unreadCount };
  },

  async getUnreadCount(userId) {
    return notificationRepository.count({
      recipient: userId,
      isRead: false
    });
  },

  async markAsRead(notificationId, userId) {
    const updated = await notificationRepository.updateById(notificationId, {
      isRead: true
    });
    return updated;
  },

  async markAllAsRead(userId) {
    await notificationRepository.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );
    return { message: 'All notifications marked as read' };
  },

  async checkAndGenerateDueSoonNotifications() {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const dueSoonTasks = await taskRepository.find({
      status: { $ne: TASK_STATUS.DONE },
      dueSoonAlertSent: false,
      dueDate: { $gt: now, $lte: in24Hours }
    });

    let generatedCount = 0;

    for (const task of dueSoonTasks) {
      if (task.assignee) {
        const recipientId = task.assignee._id || task.assignee;
        await this.createNotification({
          recipient: recipientId,
          task: task._id,
          type: NOTIFICATION_TYPES.TASK_DUE_SOON,
          message: `Task "${task.title}" is due within 24 hours (${new Date(task.dueDate).toLocaleDateString()})`
        });
        await taskRepository.updateById(task._id, { dueSoonAlertSent: true });
        generatedCount += 1;
      }
    }

    return { generatedCount, checkedTasks: dueSoonTasks.length };
  }
};

export default notificationService;
