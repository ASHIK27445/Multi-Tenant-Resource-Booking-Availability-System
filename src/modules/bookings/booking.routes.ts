import { Router } from 'express';
import { BookingController } from './booking.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantIsolation } from '../../middleware/tenantIsolation';
import { validate } from '../../middleware/validate';
import { createBookingSchema, getBookingsQuerySchema } from './booking.validation';

const router = Router();
const controller = new BookingController();

router.post(
  '/',
  authenticate,
  authorize('ORG_ADMIN', 'EMPLOYEE'),
  tenantIsolation,
  validate(createBookingSchema),
  controller.createBooking
);

router.get(
  '/',
  authenticate,
  authorize('ORG_ADMIN', 'EMPLOYEE'),
  tenantIsolation,
  validate(getBookingsQuerySchema),
  controller.getBookings
);

router.delete(
  '/:id',
  authenticate,
  authorize('ORG_ADMIN', 'EMPLOYEE'),
  tenantIsolation,
  controller.cancelBooking
);

export { router as bookingRoutes };