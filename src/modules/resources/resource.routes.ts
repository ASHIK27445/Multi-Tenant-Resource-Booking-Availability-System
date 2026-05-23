import { Router } from 'express';
import { ResourceController } from './resource.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantIsolation } from '../../middleware/tenantIsolation';
import { validate } from '../../middleware/validate';
import { createResourceSchema, updateResourceSchema } from './resource.validation';

const router = Router();
const controller = new ResourceController();

router.use(authenticate);
router.use(tenantIsolation);

router.post(
  '/',
  authorize('ORG_ADMIN'),
  validate(createResourceSchema),
  controller.createResource
);

router.get(
  '/',
  authorize('ORG_ADMIN', 'EMPLOYEE'),
  controller.getResources
);

router.get(
  '/:id',
  authorize('ORG_ADMIN', 'EMPLOYEE'),
  controller.getResource
);

router.patch(
  '/:id',
  authorize('ORG_ADMIN'),
  validate(updateResourceSchema),
  controller.updateResource
);

router.delete(
  '/:id',
  authorize('ORG_ADMIN'),
  controller.deleteResource
);

export { router as resourceRoutes };