import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantIsolation } from '../../middleware/tenantIsolation';
import { validate } from '../../middleware/validate';
import { registerUserSchema, loginSchema } from './auth.validation';

const router = Router();
const controller = new AuthController();

// Public routes (test)
router.post('/login', validate(loginSchema), controller.login);

// Protected routes
router.post(
  '/register',
  authenticate,
  authorize('ORG_ADMIN'),
  tenantIsolation,
  validate(registerUserSchema),
  controller.register
);

router.get(
  '/profile',
  authenticate,
  controller.getProfile
);

export { router as authRoutes };