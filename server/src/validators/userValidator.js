import Joi from 'joi';
import { ROLES } from '../constants/index.js';

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const createUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 50 characters'
  }),
  email: Joi.string().trim().lowercase().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address'
  }),
  password: Joi.string().min(6).max(100).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters'
  }),
  role: Joi.string().valid(...Object.values(ROLES)).required().messages({
    'any.only': `Role must be one of: ${Object.values(ROLES).join(', ')}`
  }),
  team: Joi.string().pattern(objectIdPattern).allow(null, '').optional().messages({
    'string.pattern.base': 'Team must be a valid ObjectId'
  })
});

export const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).optional(),
  role: Joi.string().valid(...Object.values(ROLES)).optional(),
  team: Joi.string().pattern(objectIdPattern).allow(null, '').optional(),
  isActive: Joi.boolean().optional()
}).min(1);

export const toggleStatusSchema = Joi.object({
  isActive: Joi.boolean().required().messages({
    'any.required': 'isActive boolean is required'
  })
});

export const userQuerySchema = Joi.object({
  role: Joi.string().valid(...Object.values(ROLES)).optional(),
  team: Joi.string().pattern(objectIdPattern).optional(),
  isActive: Joi.boolean().optional(),
  search: Joi.string().trim().max(100).allow('').optional()
});
