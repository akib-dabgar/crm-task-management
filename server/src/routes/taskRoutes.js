import { Router } from 'express';
import {
  createTask,
  getTaskById,
  listTasks,
  updateTask,
  changeStatus,
  deleteTask
} from '../controllers/taskController.js';
import commentController from '../controllers/commentController.js';
import activityController from '../controllers/activityController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRole } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validate.js';
import {
  createTaskSchema,
  updateTaskSchema,
  changeStatusSchema,
  taskQuerySchema,
  taskIdParamSchema
} from '../validators/taskValidator.js';
import { createCommentSchema } from '../validators/commentValidator.js';
import { ROLES } from '../constants/index.js';

const router = Router();

router.use(authenticate);

router.get('/', validate(taskQuerySchema, 'query'), listTasks);
router.post('/', authorizeRole(ROLES.ADMIN, ROLES.MANAGER), validate(createTaskSchema, 'body'), createTask);
router.get('/:id', validate(taskIdParamSchema, 'params'), getTaskById);
router.put('/:id', authorizeRole(ROLES.ADMIN, ROLES.MANAGER), validate(taskIdParamSchema, 'params'), validate(updateTaskSchema, 'body'), updateTask);
router.patch('/:id/status', validate(taskIdParamSchema, 'params'), validate(changeStatusSchema, 'body'), changeStatus);
router.delete('/:id', authorizeRole(ROLES.ADMIN, ROLES.MANAGER), validate(taskIdParamSchema, 'params'), deleteTask);

router.post('/:id/comments', validate(taskIdParamSchema, 'params'), validate(createCommentSchema, 'body'), commentController.createComment);
router.get('/:id/comments', validate(taskIdParamSchema, 'params'), commentController.getCommentsByTask);
router.get('/:id/activities', validate(taskIdParamSchema, 'params'), activityController.getActivityByTask);

export default router;
