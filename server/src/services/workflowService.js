import { TASK_STATUS, ROLES } from '../constants/index.js';

export const workflowService = {
  validateTransition(currentStatus, nextStatus, userRole, reviewReason) {
    if (currentStatus === nextStatus) {
      const error = new Error(`Task is already in status "${currentStatus}"`);
      error.statusCode = 400;
      throw error;
    }

    if (currentStatus === TASK_STATUS.DONE && userRole !== ROLES.ADMIN) {
      const error = new Error('Completed tasks cannot be reopened');
      error.statusCode = 400;
      throw error;
    }

    if (userRole === ROLES.EMPLOYEE) {
      if (nextStatus === TASK_STATUS.DONE) {
        const error = new Error('Employees are not authorized to mark tasks as Done. Only Managers or Admins can approve and complete tasks.');
        error.statusCode = 403;
        throw error;
      }

      const validEmployeeTransitions = {
        [TASK_STATUS.TO_DO]: [TASK_STATUS.IN_PROGRESS],
        [TASK_STATUS.IN_PROGRESS]: [TASK_STATUS.IN_REVIEW],
        [TASK_STATUS.IN_REVIEW]: []
      };

      const allowedNext = validEmployeeTransitions[currentStatus] || [];
      if (!allowedNext.includes(nextStatus)) {
        const error = new Error(`Invalid status transition from "${currentStatus}" to "${nextStatus}" for Employee role`);
        error.statusCode = 400;
        throw error;
      }

      return;
    }

    if (currentStatus === TASK_STATUS.IN_REVIEW && nextStatus === TASK_STATUS.IN_PROGRESS) {
      if (!reviewReason || !reviewReason.trim()) {
        const error = new Error('Review reason is mandatory when moving a task back from In Review to In Progress');
        error.statusCode = 400;
        throw error;
      }
      return;
    }

    const validStandardTransitions = {
      [TASK_STATUS.TO_DO]: [TASK_STATUS.IN_PROGRESS],
      [TASK_STATUS.IN_PROGRESS]: [TASK_STATUS.IN_REVIEW],
      [TASK_STATUS.IN_REVIEW]: [TASK_STATUS.DONE, TASK_STATUS.IN_PROGRESS],
      [TASK_STATUS.DONE]: [TASK_STATUS.IN_PROGRESS]
    };

    if (userRole !== ROLES.ADMIN) {
      const allowedNext = validStandardTransitions[currentStatus] || [];
      if (!allowedNext.includes(nextStatus)) {
        const error = new Error(`Invalid workflow progression from "${currentStatus}" to "${nextStatus}"`);
        error.statusCode = 400;
        throw error;
      }
    }
  }
};

export default workflowService;
