import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { loginValidator } from '../validators/auth.validator';
import { validate } from '../middlewares/validate.middleware';
import { authRateLimiter } from '../middlewares/rateLimiter.middleware';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Registration is intentionally disabled — this system provisions exactly
// one administrator account via an automatic startup seed. These routes
// exist only to return a clear, explicit error instead of a bare 404 for
// anyone (or any old client code) that still calls them.
router.post('/signup', authController.registrationDisabled);
router.post('/register', authController.registrationDisabled);

router.post('/login', authRateLimiter, loginValidator, validate, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
