import activityLogRepository from '../repositories/activityLogRepository.js';
import taskRepository from '../repositories/taskRepository.js';
import { ROLES } from '../constants/index.js';

export const activityService = {
  async logActivity({ task, user, action, details = {} }) {
    return activityLogRepository.create({
      task,
      user,
      action,
      details
    });
  },

  async getActivityByTask(taskId, requestingUser) {
    const task = await taskRepository.findById(taskId);
    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    const taskTeamId = String(task.team?._id || task.team);
    const userTeamId = requestingUser.team?._id
      ? String(requestingUser.team._id)
      : String(requestingUser.team || '');

    if (requestingUser.role === ROLES.MANAGER) {
      if (taskTeamId !== userTeamId) {
        const error = new Error('Access denied: You can only view activity for your own team tasks');
        error.statusCode = 403;
        throw error;
      }
    } else if (requestingUser.role === ROLES.EMPLOYEE) {
      const assigneeId = String(task.assignee?._id || task.assignee);
      if (assigneeId !== String(requestingUser._id)) {
        const error = new Error('Access denied: You can only view activity for tasks assigned to you');
        error.statusCode = 403;
        throw error;
      }
    }

    return activityLogRepository.find({ task: taskId }, null, {
      sort: { createdAt: -1 }
    });
  }
};

export default activityService;
