import Joi from 'joi';
import { PROJECT_STATUS } from '../constants/index.js';

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const createProjectSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Project name is required',
    'string.min': 'Project name must be at least 2 characters',
    'string.max': 'Project name cannot exceed 100 characters'
  }),
  description: Joi.string().trim().max(500).allow('').optional(),
  clientName: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Client name is required',
    'string.min': 'Client name must be at least 2 characters',
    'string.max': 'Client name cannot exceed 100 characters'
  }),
  startDate: Joi.date().iso().required().messages({
    'any.required': 'Start date is required',
    'date.base': 'Start date must be a valid ISO date'
  }),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required().messages({
    'any.required': 'End date is required',
    'date.min': 'End date must be greater than or equal to start date'
  }),
  status: Joi.string().valid(...Object.values(PROJECT_STATUS)).default(PROJECT_STATUS.PLANNING),
  team: Joi.string().pattern(objectIdPattern).required().messages({
    'string.empty': 'Team is required',
    'string.pattern.base': 'Team must be a valid ObjectId'
  })
});

export const updateProjectSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  description: Joi.string().trim().max(500).allow('').optional(),
  clientName: Joi.string().trim().min(2).max(100).optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  status: Joi.string().valid(...Object.values(PROJECT_STATUS)).optional(),
  team: Joi.string().pattern(objectIdPattern).optional()
}).min(1);

export const projectQuerySchema = Joi.object({
  status: Joi.string().valid(...Object.values(PROJECT_STATUS)).optional(),
  team: Joi.string().pattern(objectIdPattern).optional(),
  search: Joi.string().trim().max(100).allow('').optional()
});

export const projectIdParamSchema = Joi.object({
  id: Joi.string().pattern(objectIdPattern).required().messages({
    'string.pattern.base': 'Project ID must be a valid ObjectId'
  })
});
