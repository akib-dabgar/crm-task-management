import { ROLES } from '../constants/index.js';

export const canManageUsersAndTeams = (user) => {
  return user && user.role === ROLES.ADMIN;
};

export const canCreateProject = (user, targetTeamId) => {
  if (!user) return false;
  if (user.role === ROLES.ADMIN) return true;
  if (user.role === ROLES.MANAGER) {
    return user.team && user.team.toString() === targetTeamId.toString();
  }
  return false;
};

export const canViewProject = (user, projectTeamId) => {
  if (!user) return false;
  if (user.role === ROLES.ADMIN) return true;
  if (user.role === ROLES.MANAGER || user.role === ROLES.EMPLOYEE) {
    return user.team && user.team.toString() === projectTeamId.toString();
  }
  return false;
};

export const canCreateTask = (user, projectTeamId) => {
  if (!user) return false;
  if (user.role === ROLES.ADMIN) return true;
  if (user.role === ROLES.MANAGER) {
    return user.team && user.team.toString() === projectTeamId.toString();
  }
  return false;
};

export const canViewTask = (user, task) => {
  if (!user || !task) return false;
  if (user.role === ROLES.ADMIN) return true;
  if (user.role === ROLES.MANAGER) {
    return user.team && user.team.toString() === task.team.toString();
  }
  if (user.role === ROLES.EMPLOYEE) {
    const assigneeId = task.assignee?._id || task.assignee;
    return assigneeId && assigneeId.toString() === user._id.toString();
  }
  return false;
};

export const canEditTaskDetails = (user, task) => {
  if (!user || !task) return false;
  if (user.role === ROLES.ADMIN) return true;
  if (user.role === ROLES.MANAGER) {
    return user.team && user.team.toString() === task.team.toString();
  }
  return false;
};

export const canChangeTaskStatus = (user, task) => {
  if (!user || !task) return false;
  if (user.role === ROLES.ADMIN) return true;
  if (user.role === ROLES.MANAGER) {
    return user.team && user.team.toString() === task.team.toString();
  }
  if (user.role === ROLES.EMPLOYEE) {
    const assigneeId = task.assignee?._id || task.assignee;
    return assigneeId && assigneeId.toString() === user._id.toString();
  }
  return false;
};

export const canMarkTaskDone = (user, task) => {
  if (!user || !task) return false;
  if (user.role === ROLES.ADMIN) return true;
  if (user.role === ROLES.MANAGER) {
    return user.team && user.team.toString() === task.team.toString();
  }
  return false;
};

export const canCommentOnTask = (user, task) => {
  return canViewTask(user, task);
};
