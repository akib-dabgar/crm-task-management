import commentRepository from '../repositories/commentRepository.js';
import taskRepository from '../repositories/taskRepository.js';
import activityService from './activityService.js';
import notificationService from './notificationService.js';
import { ROLES, ACTION_TYPES, NOTIFICATION_TYPES } from '../constants/index.js';

export const commentService = {
  async createComment(taskId, content, requestingUser) {
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
        const error = new Error('Managers can only comment on tasks belonging to their own team');
        error.statusCode = 403;
        throw error;
      }
    } else if (requestingUser.role === ROLES.EMPLOYEE) {
      const assigneeId = String(task.assignee?._id || task.assignee);
      if (assigneeId !== String(requestingUser._id)) {
        const error = new Error('Employees can only comment on tasks assigned to them');
        error.statusCode = 403;
        throw error;
      }
    }

    const comment = await commentRepository.create({
      task: taskId,
      author: requestingUser._id,
      content: content.trim()
    });

    await activityService.logActivity({
      task: taskId,
      user: requestingUser._id,
      action: ACTION_TYPES.COMMENT_ADDED,
      details: { preview: content.trim().slice(0, 80) }
    });

    const assigneeId = String(task.assignee?._id || task.assignee);
    if (assigneeId && assigneeId !== String(requestingUser._id)) {
      await notificationService.createNotification({
        recipient: assigneeId,
        task: task._id,
        type: NOTIFICATION_TYPES.STATUS_UPDATED,
        message: `${requestingUser.name} commented on your task: "${task.title}"`,
        senderId: requestingUser._id
      });
    }

    const populated = await commentRepository.find({ _id: comment._id });
    return populated[0];
  },

  async getCommentsByTask(taskId, requestingUser) {
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
        const error = new Error('Access denied: You can only view comments for your own team tasks');
        error.statusCode = 403;
        throw error;
      }
    } else if (requestingUser.role === ROLES.EMPLOYEE) {
      const assigneeId = String(task.assignee?._id || task.assignee);
      if (assigneeId !== String(requestingUser._id)) {
        const error = new Error('Access denied: Employees can only view comments for tasks assigned to them');
        error.statusCode = 403;
        throw error;
      }
    }

    return commentRepository.find({ task: taskId }, null, {
      sort: { createdAt: 1 }
    });
  }
};

export default commentService;
