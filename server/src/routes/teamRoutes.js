import { Router } from 'express';
import {
  createTeam,
  updateTeam,
  getTeamById,
  listTeams,
  deleteTeam
} from '../controllers/teamController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRole } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validate.js';
import {
  createTeamSchema,
  updateTeamSchema,
  teamIdParamSchema
} from '../validators/teamValidator.js';
import { ROLES } from '../constants/index.js';

const router = Router();

router.use(authenticate);

router.get('/', listTeams);
router.post('/', authorizeRole(ROLES.ADMIN), validate(createTeamSchema, 'body'), createTeam);
router.get('/:id', validate(teamIdParamSchema, 'params'), getTeamById);
router.put('/:id', authorizeRole(ROLES.ADMIN), validate(teamIdParamSchema, 'params'), validate(updateTeamSchema, 'body'), updateTeam);
router.delete('/:id', authorizeRole(ROLES.ADMIN), validate(teamIdParamSchema, 'params'), deleteTeam);

export default router;
