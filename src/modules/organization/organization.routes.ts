import { Router } from 'express';
import { OrganizationController } from './organization.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantIsolation } from '../../middleware/tenantIsolation';
import { validate } from '../../middleware/validate';
import { 
  createOrganizationSchema, 
  updateOrganizationSchema 
} from './organization.validation';

const router = Router();
const controller = new OrganizationController();

// Public route for initial organization creation (during setup)
router.post(
  '/',
  validate(createOrganizationSchema),
  controller.createOrganization
);

// Protected routes
router.get(
  '/my-organization',
  authenticate,
  authorize('ORG_ADMIN', 'EMPLOYEE'),
  tenantIsolation,
  controller.getMyOrganization
);

router.get(
  '/:id',
  authenticate,
  authorize('ORG_ADMIN'),
  controller.getOrganization
);

router.patch(
  '/:id',
  authenticate,
  authorize('ORG_ADMIN'),
  tenantIsolation,
  validate(updateOrganizationSchema),
  controller.updateOrganization
);

export { router as organizationRoutes };