import { Router } from 'express';
import { login, getMe, logout } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { loginSchema } from '../validators/authValidator.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/login', validate(loginSchema, 'body'), login);
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

export default router;
