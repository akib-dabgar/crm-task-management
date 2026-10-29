import Joi from 'joi';
import { TASK_STATUS, TASK_PRIORITY } from '../constants/index.js';

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const createTaskSchema = Joi.object({
  title: Joi.string().trim().min(3).max(150).required().messages({
    'string.empty': 'Task title is required',
    'string.min': 'Task title must be at least 3 characters',
    'string.max': 'Task title cannot exceed 150 characters'
  }),
  description: Joi.string().trim().max(2000).allow('').optional(),
  project: Joi.string().pattern(objectIdPattern).required().messages({
    'string.empty': 'Project is required',
    'string.pattern.base': 'Project must be a valid ObjectId'
  }),
  assignee: Joi.string().pattern(objectIdPattern).required().messages({
    'string.empty': 'Assignee is required',
    'string.pattern.base': 'Assignee must be a valid ObjectId'
  }),
  priority: Joi.string().valid(...Object.values(TASK_PRIORITY)).default(TASK_PRIORITY.MEDIUM),
  dueDate: Joi.date().iso().required().messages({
    'any.required': 'Due date is required',
    'date.base': 'Due date must be a valid ISO date'
  }),
  attachments: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().trim().required(),
        url: Joi.string().trim().required()
      })
    )
    .optional()
});

export const updateTaskSchema = Joi.object({
  title: Joi.string().trim().min(3).max(150).optional(),
  description: Joi.string().trim().max(2000).allow('').optional(),
  assignee: Joi.string().pattern(objectIdPattern).optional(),
  priority: Joi.string().valid(...Object.values(TASK_PRIORITY)).optional(),
  dueDate: Joi.date().iso().optional(),
  attachments: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().trim().required(),
        url: Joi.string().trim().required()
      })
    )
    .optional()
}).min(1);

export const changeStatusSchema = Joi.object({
  status: Joi.string().valid(...Object.values(TASK_STATUS)).required().messages({
    'string.empty': 'Status is required',
    'any.only': `Status must be one of: ${Object.values(TASK_STATUS).join(', ')}`
  }),
  reviewReason: Joi.string().trim().max(500).allow('').optional()
});

export const taskQuerySchema = Joi.object({
  status: Joi.string().valid(...Object.values(TASK_STATUS)).optional(),
  priority: Joi.string().valid(...Object.values(TASK_PRIORITY)).optional(),
  assignee: Joi.string().pattern(objectIdPattern).optional(),
  project: Joi.string().pattern(objectIdPattern).optional(),
  dueDateFrom: Joi.date().iso().optional(),
  dueDateTo: Joi.date().iso().optional(),
  search: Joi.string().trim().max(100).allow('').optional(),
  isOverdue: Joi.boolean().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

export const taskIdParamSchema = Joi.object({
  id: Joi.string().pattern(objectIdPattern).required().messages({
    'string.pattern.base': 'Task ID must be a valid ObjectId'
  })
});
