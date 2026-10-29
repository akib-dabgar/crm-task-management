import { Router } from 'express';
import {
  createProject,
  getProjectById,
  listProjects,
  updateProject,
  deleteProject
} from '../controllers/projectController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRole } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validate.js';
import {
  createProjectSchema,
  updateProjectSchema,
  projectQuerySchema,
  projectIdParamSchema
} from '../validators/projectValidator.js';
import { ROLES } from '../constants/index.js';

const router = Router();

router.use(authenticate);

router.get('/', validate(projectQuerySchema, 'query'), listProjects);
router.post('/', authorizeRole(ROLES.ADMIN, ROLES.MANAGER), validate(createProjectSchema, 'body'), createProject);
router.get('/:id', validate(projectIdParamSchema, 'params'), getProjectById);
router.put('/:id', authorizeRole(ROLES.ADMIN, ROLES.MANAGER), validate(projectIdParamSchema, 'params'), validate(updateProjectSchema, 'body'), updateProject);
router.delete('/:id', authorizeRole(ROLES.ADMIN, ROLES.MANAGER), validate(projectIdParamSchema, 'params'), deleteProject);

export default router;
