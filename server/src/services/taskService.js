import taskRepository from '../repositories/taskRepository.js';
import projectRepository from '../repositories/projectRepository.js';
import userRepository from '../repositories/userRepository.js';
import workflowService from './workflowService.js';
import activityService from './activityService.js';
import notificationService from './notificationService.js';
import { ROLES, TASK_STATUS, ACTION_TYPES, NOTIFICATION_TYPES } from '../constants/index.js';

const computeIsOverdue = (task) => {
  return task.status !== TASK_STATUS.DONE && new Date(task.dueDate) < new Date();
};

export const taskService = {
  async createTask(taskData, requestingUser) {
    if (requestingUser.role === ROLES.EMPLOYEE) {
      const error = new Error('Employees are not authorized to create tasks');
      error.statusCode = 403;
      throw error;
    }

    const project = await projectRepository.findById(taskData.project);
    if (!project) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }

    const projectTeamId = String(project.team?._id || project.team);

    if (requestingUser.role === ROLES.MANAGER) {
      const managerTeamId = requestingUser.team?._id
        ? String(requestingUser.team._id)
        : String(requestingUser.team || '');

      if (!managerTeamId || managerTeamId !== projectTeamId) {
        const error = new Error('Managers can only create tasks for projects belonging to their own team');
        error.statusCode = 403;
        throw error;
      }
    }

    const assignee = await userRepository.findById(taskData.assignee);
    if (!assignee) {
      const error = new Error('Assignee user not found');
      error.statusCode = 404;
      throw error;
    }

    if (!assignee.isActive) {
      const error = new Error('Cannot assign task to a deactivated user');
      error.statusCode = 400;
      throw error;
    }

    if (assignee.role !== ROLES.EMPLOYEE) {
      const error = new Error('Task assignee must have the Employee role');
      error.statusCode = 400;
      throw error;
    }

    const assigneeTeamId = String(assignee.team?._id || assignee.team || '');
    if (assigneeTeamId !== projectTeamId) {
      const error = new Error('Assignee must belong to the project team');
      error.statusCode = 400;
      throw error;
    }

    const task = await taskRepository.create({
      ...taskData,
      team: projectTeamId,
      createdBy: requestingUser._id,
      status: TASK_STATUS.TO_DO
    });

    await activityService.logActivity({
      task: task._id,
      user: requestingUser._id,
      action: ACTION_TYPES.CREATED,
      details: {
        title: task.title,
        assignee: assignee.name,
        priority: task.priority
      }
    });

    await notificationService.createNotification({
      recipient: assignee._id,
      task: task._id,
      type: NOTIFICATION_TYPES.TASK_ASSIGNED,
      message: `You have been assigned to task: "${task.title}"`,
      senderId: requestingUser._id
    });

    const populated = await taskRepository.findById(task._id);
    return {
      ...populated.toObject(),
      isOverdue: computeIsOverdue(populated)
    };
  },

  async getTaskById(taskId, requestingUser) {
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
        const error = new Error('Access denied: You can only view tasks belonging to your own team');
        error.statusCode = 403;
        throw error;
      }
    } else if (requestingUser.role === ROLES.EMPLOYEE) {
      const assigneeId = String(task.assignee?._id || task.assignee);
      if (assigneeId !== String(requestingUser._id)) {
        const error = new Error('Access denied: Employees can only view tasks assigned to them');
        error.statusCode = 403;
        throw error;
      }
    }

    return {
      ...task.toObject(),
      isOverdue: computeIsOverdue(task)
    };
  },

  async listTasks(queryFilters = {}, requestingUser) {
    const filter = {};

    if (requestingUser.role === ROLES.ADMIN) {
      if (queryFilters.team) {
        filter.team = queryFilters.team;
      }
      if (queryFilters.assignee) {
        filter.assignee = queryFilters.assignee;
      }
    } else if (requestingUser.role === ROLES.MANAGER) {
      const userTeamId = requestingUser.team?._id
        ? String(requestingUser.team._id)
        : String(requestingUser.team || '');

      if (!userTeamId) {
        return { tasks: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } };
      }
      filter.team = userTeamId;

      if (queryFilters.assignee) {
        filter.assignee = queryFilters.assignee;
      }
    } else if (requestingUser.role === ROLES.EMPLOYEE) {
      filter.assignee = requestingUser._id;
    }

    if (queryFilters.project) {
      filter.project = queryFilters.project;
    }

    if (queryFilters.status) {
      filter.status = queryFilters.status;
    }

    if (queryFilters.priority) {
      filter.priority = queryFilters.priority;
    }

    if (queryFilters.dueDateFrom || queryFilters.dueDateTo) {
      filter.dueDate = {};
      if (queryFilters.dueDateFrom) {
        filter.dueDate.$gte = new Date(queryFilters.dueDateFrom);
      }
      if (queryFilters.dueDateTo) {
        filter.dueDate.$lte = new Date(queryFilters.dueDateTo);
      }
    }

    if (queryFilters.isOverdue === true || queryFilters.isOverdue === 'true') {
      filter.status = { $ne: TASK_STATUS.DONE };
      filter.dueDate = { ...(filter.dueDate || {}), $lt: new Date() };
    }

    if (queryFilters.search && queryFilters.search.trim()) {
      const regex = new RegExp(queryFilters.search.trim(), 'i');
      filter.$or = [{ title: regex }, { description: regex }];
    }

    const page = Math.max(1, parseInt(queryFilters.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(queryFilters.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const total = await taskRepository.count(filter);
    const tasks = await taskRepository.find(filter, null, {
      sort: { dueDate: 1, createdAt: -1 },
      skip,
      limit
    });

    const enrichedTasks = tasks.map((t) => ({
      ...t.toObject(),
      isOverdue: computeIsOverdue(t)
    }));

    return {
      tasks: enrichedTasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  },

  async updateTask(taskId, updateData, requestingUser) {
    const task = await taskRepository.findById(taskId);
    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    if (requestingUser.role === ROLES.EMPLOYEE) {
      const error = new Error('Employees are not authorized to edit task details');
      error.statusCode = 403;
      throw error;
    }

    const taskTeamId = String(task.team?._id || task.team);
    const userTeamId = requestingUser.team?._id
      ? String(requestingUser.team._id)
      : String(requestingUser.team || '');

    if (requestingUser.role === ROLES.MANAGER && taskTeamId !== userTeamId) {
      const error = new Error('Managers can only edit tasks belonging to their own team');
      error.statusCode = 403;
      throw error;
    }

    let reassigned = false;
    let newAssigneeUser = null;

    if (updateData.assignee && String(updateData.assignee) !== String(task.assignee?._id || task.assignee)) {
      newAssigneeUser = await userRepository.findById(updateData.assignee);
      if (!newAssigneeUser) {
        const error = new Error('New assignee not found');
        error.statusCode = 404;
        throw error;
      }
      if (!newAssigneeUser.isActive) {
        const error = new Error('Cannot assign task to a deactivated user');
        error.statusCode = 400;
        throw error;
      }
      if (newAssigneeUser.role !== ROLES.EMPLOYEE) {
        const error = new Error('Assignee must have Employee role');
        error.statusCode = 400;
        throw error;
      }
      const newAssigneeTeamId = String(newAssigneeUser.team?._id || newAssigneeUser.team || '');
      if (newAssigneeTeamId !== taskTeamId) {
        const error = new Error('Assignee must belong to the task team');
        error.statusCode = 400;
        throw error;
      }
      reassigned = true;
    }

    const updated = await taskRepository.updateById(taskId, updateData);

    if (reassigned && newAssigneeUser) {
      await activityService.logActivity({
        task: taskId,
        user: requestingUser._id,
        action: ACTION_TYPES.REASSIGNED,
        details: {
          from: task.assignee?.name || 'Previous',
          to: newAssigneeUser.name
        }
      });

      await notificationService.createNotification({
        recipient: newAssigneeUser._id,
        task: taskId,
        type: NOTIFICATION_TYPES.TASK_ASSIGNED,
        message: `Task "${task.title}" was reassigned to you by ${requestingUser.name}`,
        senderId: requestingUser._id
      });
    } else {
      await activityService.logActivity({
        task: taskId,
        user: requestingUser._id,
        action: ACTION_TYPES.DETAILS_EDITED,
        details: updateData
      });
    }

    return {
      ...updated.toObject(),
      isOverdue: computeIsOverdue(updated)
    };
  },

  async changeStatus(taskId, { status, reviewReason = '' }, requestingUser) {
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

    if (requestingUser.role === ROLES.EMPLOYEE) {
      const assigneeId = String(task.assignee?._id || task.assignee);
      if (assigneeId !== String(requestingUser._id)) {
        const error = new Error('Employees can only change status of tasks assigned to them');
        error.statusCode = 403;
        throw error;
      }
    } else if (requestingUser.role === ROLES.MANAGER) {
      if (taskTeamId !== userTeamId) {
        const error = new Error('Managers can only change status of their own team tasks');
        error.statusCode = 403;
        throw error;
      }
    }

    workflowService.validateTransition(
      task.status,
      status,
      requestingUser.role,
      reviewReason
    );

    const updateFields = { status };
    const isReturned =
      task.status === TASK_STATUS.IN_REVIEW && status === TASK_STATUS.IN_PROGRESS;

    if (isReturned) {
      updateFields.reviewReason = reviewReason.trim();
    }

    const updated = await taskRepository.updateById(taskId, updateFields);

    const action = isReturned
      ? ACTION_TYPES.RETURNED_TO_IN_PROGRESS
      : ACTION_TYPES.STATUS_CHANGED;

    await activityService.logActivity({
      task: taskId,
      user: requestingUser._id,
      action,
      details: {
        from: task.status,
        to: status,
        reason: reviewReason || undefined
      }
    });

    const assigneeId = String(task.assignee?._id || task.assignee);

    if (isReturned && assigneeId) {
      await notificationService.createNotification({
        recipient: assigneeId,
        task: taskId,
        type: NOTIFICATION_TYPES.TASK_RETURNED,
        message: `Task "${task.title}" was returned to In Progress: "${reviewReason}"`,
        senderId: requestingUser._id
      });
    } else if (status === TASK_STATUS.IN_REVIEW) {
      const managerId = task.team?.manager?._id || task.team?.manager;
      if (managerId) {
        await notificationService.createNotification({
          recipient: managerId,
          task: taskId,
          type: NOTIFICATION_TYPES.STATUS_UPDATED,
          message: `Task "${task.title}" was moved to In Review by ${requestingUser.name}`,
          senderId: requestingUser._id
        });
      }
    } else if (status === TASK_STATUS.DONE && assigneeId) {
      await notificationService.createNotification({
        recipient: assigneeId,
        task: taskId,
        type: NOTIFICATION_TYPES.STATUS_UPDATED,
        message: `Task "${task.title}" was marked Done by ${requestingUser.name}`,
        senderId: requestingUser._id
      });
    }

    return {
      ...updated.toObject(),
      isOverdue: computeIsOverdue(updated)
    };
  },

  async deleteTask(taskId, requestingUser) {
    const task = await taskRepository.findById(taskId);
    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    if (requestingUser.role === ROLES.EMPLOYEE) {
      const error = new Error('Employees cannot delete tasks');
      error.statusCode = 403;
      throw error;
    }

    const taskTeamId = String(task.team?._id || task.team);
    const userTeamId = requestingUser.team?._id
      ? String(requestingUser.team._id)
      : String(requestingUser.team || '');

    if (requestingUser.role === ROLES.MANAGER && taskTeamId !== userTeamId) {
      const error = new Error('Managers can only delete tasks for their own team');
      error.statusCode = 403;
      throw error;
    }

    await taskRepository.deleteById(taskId);
    return { message: 'Task deleted successfully' };
  }
};

export default taskService;
