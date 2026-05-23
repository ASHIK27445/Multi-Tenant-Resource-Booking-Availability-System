import { Router } from 'express';
import { AvailabilityController } from './availability.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantIsolation } from '../../middleware/tenantIsolation';
import { validate } from '../../middleware/validate';
import { getAvailabilitySchema } from './availability.validation';

const router = Router();
const controller = new AvailabilityController()

router.get(
  '/',
  authenticate,
  authorize('ORG_ADMIN', 'EMPLOYEE'),
  tenantIsolation,
  validate(getAvailabilitySchema),
  controller.getAvailability
)

export { router as availabilityRoutes }