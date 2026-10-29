import Joi from 'joi';

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const createTeamSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required().messages({
    'string.empty': 'Team name is required',
    'string.min': 'Team name must be at least 2 characters',
    'string.max': 'Team name cannot exceed 80 characters'
  }),
  description: Joi.string().trim().max(300).allow('').optional(),
  manager: Joi.string().pattern(objectIdPattern).required().messages({
    'string.empty': 'Team manager is required',
    'string.pattern.base': 'Manager must be a valid ObjectId'
  }),
  employeeIds: Joi.array().items(Joi.string().pattern(objectIdPattern)).optional()
});

export const updateTeamSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).optional(),
  description: Joi.string().trim().max(300).allow('').optional(),
  manager: Joi.string().pattern(objectIdPattern).optional(),
  employeeIds: Joi.array().items(Joi.string().pattern(objectIdPattern)).optional()
}).min(1);

export const teamIdParamSchema = Joi.object({
  id: Joi.string().pattern(objectIdPattern).required().messages({
    'string.pattern.base': 'Team ID must be a valid ObjectId'
  })
});
