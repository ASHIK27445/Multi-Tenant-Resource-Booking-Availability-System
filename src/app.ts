import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './modules/auth/auth.routes';
import { organizationRoutes } from './modules/organization/organization.routes';
import { resourceRoutes } from './modules/resources/resource.routes';
import { bookingRoutes } from './modules/bookings/booking.routes';
import { availabilityRoutes } from './modules/availability/availability.routes';
import { setupRoutes } from './modules/auth/setup.routes';

const app = express();

// middleware
app.use(helmet());
app.use(cors());

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Routes
app.use('/api/setup', setupRoutes)
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/availability', availabilityRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

export { app };