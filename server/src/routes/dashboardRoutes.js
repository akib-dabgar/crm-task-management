import { Router } from 'express';
import dashboardController from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/stats', dashboardController.getDashboardStats);

export default router;
