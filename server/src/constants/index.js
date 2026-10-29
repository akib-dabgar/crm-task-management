export const ROLES = Object.freeze({
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employee'
});

export const TASK_STATUS = Object.freeze({
  TO_DO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done'
});

export const TASK_PRIORITY = Object.freeze({
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent'
});

export const PROJECT_STATUS = Object.freeze({
  PLANNING: 'Planning',
  ACTIVE: 'Active',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed'
});

export const NOTIFICATION_TYPES = Object.freeze({
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  STATUS_UPDATED: 'STATUS_UPDATED',
  TASK_DUE_SOON: 'TASK_DUE_SOON',
  TASK_RETURNED: 'TASK_RETURNED'
});

export const ACTION_TYPES = Object.freeze({
  CREATED: 'CREATED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  ASSIGNED: 'ASSIGNED',
  REASSIGNED: 'REASSIGNED',
  DETAILS_EDITED: 'DETAILS_EDITED',
  RETURNED_TO_IN_PROGRESS: 'RETURNED_TO_IN_PROGRESS',
  COMMENT_ADDED: 'COMMENT_ADDED'
});
