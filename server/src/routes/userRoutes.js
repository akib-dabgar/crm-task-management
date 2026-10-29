import { Router } from 'express';
import {
  createUser,
  updateUser,
  toggleStatus,
  listUsers,
  getUserById
} from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRole } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validate.js';
import {
  createUserSchema,
  updateUserSchema,
  toggleStatusSchema,
  userQuerySchema
} from '../validators/userValidator.js';
import { ROLES } from '../constants/index.js';

const router = Router();

router.use(authenticate);

router.get('/', authorizeRole(ROLES.ADMIN, ROLES.MANAGER), validate(userQuerySchema, 'query'), listUsers);
router.post('/', authorizeRole(ROLES.ADMIN), validate(createUserSchema, 'body'), createUser);
router.get('/:id', authorizeRole(ROLES.ADMIN), getUserById);
router.put('/:id', authorizeRole(ROLES.ADMIN), validate(updateUserSchema, 'body'), updateUser);
router.patch('/:id/status', authorizeRole(ROLES.ADMIN), validate(toggleStatusSchema, 'body'), toggleStatus);

export default router;
