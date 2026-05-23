import { Types } from 'mongoose';
import { DateTime } from 'luxon';
import { Booking, IBooking } from './booking.model';
import { Resource } from '../resources/resource.model';
import { Organization } from '../organization/organization.model';
import { AvailabilityService } from '../availability/availability.service';
import { DateTimeUtils } from '../../shared/utils/dateTime.utils';
import { 
  NotFoundError, 
  ConflictError, 
  ValidationError,
  ForbiddenError 
} from '../../shared/errors/AppError';

export class BookingService {
  private availabilityService: AvailabilityService;

  constructor() {
    this.availabilityService = new AvailabilityService();
  }

  async createBooking(
    bookingData: {
      resourceId: string;
      startTime: string;
      endTime: string;
      title: string;
      description?: string;
    },
    userId: string,
    organizationId: string
  ): Promise<IBooking> {
    const [organization, resource] = await Promise.all([
      Organization.findById(organizationId).lean(),
      Resource.findOne({
        _id: bookingData.resourceId,
        organizationId,
        isActive: true,
      }).lean(),
    ]);

    if (!organization) throw new NotFoundError('Organization');
    if (!resource) throw new NotFoundError('Resource');

    const timezone = organization.timezone;
    const startTime = DateTimeUtils.createInTimezone(bookingData.startTime, timezone);
    const endTime = DateTimeUtils.createInTimezone(bookingData.endTime, timezone);
    const now = DateTimeUtils.getCurrentTimeInTimezone(timezone);

    this.validateBookingTimes(startTime, endTime, now, organization, resource);

    const { isAvailable, conflicts } = await this.availabilityService.checkSlotAvailability(
      bookingData.resourceId,
      organizationId,
      startTime.toJSDate(),
      endTime.toJSDate()
    );

    if (!isAvailable) {
      throw new ConflictError('Booking conflicts with existing bookings', {
        conflicts: conflicts.map(c => ({
          id: c.id,
          startTime: c.startTime,
          endTime: c.endTime,
        })),
      });
    }

    await this.validateBufferTime(
      startTime.toJSDate(),
      endTime.toJSDate(),
      resource,
      organization,
      bookingData.resourceId,
      organizationId
    );

    const booking = await Booking.create({
      ...bookingData,
      startTime: startTime.toJSDate(),
      endTime: endTime.toJSDate(),
      userId: new Types.ObjectId(userId),
      organizationId: new Types.ObjectId(organizationId),
      resourceId: new Types.ObjectId(bookingData.resourceId),
      status: 'CONFIRMED',
    });

    return booking;
  }

  private validateBookingTimes(
    startTime: DateTime,
    endTime: DateTime,
    now: DateTime,
    organization: any,
    resource: any
  ): void {
    if (endTime <= startTime) {
      throw new ValidationError('End time must be after start time');
    }

    if (startTime <= now) {
      throw new ValidationError('Cannot create bookings in the past');
    }

    const minimumStart = now.plus({
      hours: organization.bookingPolicy.minAdvanceBookingHours,
    });
    if (startTime < minimumStart) {
      throw new ValidationError(
        `Booking must be made at least ${organization.bookingPolicy.minAdvanceBookingHours} hours in advance`
      );
    }

    const maxAdvanceDate = now.plus({
      days: organization.bookingPolicy.maxAdvanceBookingDays,
    }).endOf('day');
    if (startTime > maxAdvanceDate) {
      throw new ValidationError(
        `Cannot book more than ${organization.bookingPolicy.maxAdvanceBookingDays} days in advance`
      );
    }

    const dayOfWeek = startTime.weekday === 7 ? 0 : startTime.weekday;
    const workingDayConfig = organization.workingHours.find(
      (wh: any) => wh.dayOfWeek === dayOfWeek
    );

    if (!workingDayConfig?.isWorkingDay) {
      throw new ValidationError('Cannot book on non-working days');
    }

    const workStart = DateTimeUtils.combineDateAndTime(
      startTime,
      workingDayConfig.startTime
    );
    const workEnd = DateTimeUtils.combineDateAndTime(
      startTime,
      workingDayConfig.endTime
    );

    if (startTime < workStart || endTime > workEnd) {
      throw new ValidationError('Booking must be within working hours');
    }

    const durationMinutes = DateTimeUtils.differenceInMinutes(endTime, startTime);
    const { minDurationMinutes, maxDurationMinutes } = organization.bookingPolicy;

    if (durationMinutes < minDurationMinutes) {
      throw new ValidationError(
        `Booking duration must be at least ${minDurationMinutes} minutes`
      );
    }

    if (durationMinutes > maxDurationMinutes) {
      throw new ValidationError(
        `Booking duration cannot exceed ${maxDurationMinutes} minutes`
      );
    }
  }

  private async validateBufferTime(
    startTime: Date,
    endTime: Date,
    resource: any,
    organization: any,
    resourceId: string,
    organizationId: string
  ): Promise<void> {
    const bufferMinutes = resource.bufferTimeMinutes ?? 
                         organization.bookingPolicy.bufferTimeMinutes;

    if (bufferMinutes <= 0) return;

    const adjacentBookings = await Booking.find({
      resourceId: new Types.ObjectId(resourceId),
      organizationId: new Types.ObjectId(organizationId),
      status: 'CONFIRMED',
      isDeleted: false,
      $or: [
        {
          endTime: {
            $gt: new Date(startTime.getTime() - bufferMinutes * 60000),
            $lte: startTime,
          },
        },
        {
          startTime: {
            $gte: endTime,
            $lt: new Date(endTime.getTime() + bufferMinutes * 60000),
          },
        },
      ],
    }).lean();

    if (adjacentBookings.length > 0) {
      throw new ConflictError(
        'Booking violates buffer time requirements with adjacent bookings',
        {
          conflictingBookings: adjacentBookings.map(b => ({
            id: b._id,
            startTime: b.startTime,
            endTime: b.endTime,
          })),
        }
      );
    }
  }

  async cancelBooking(
    bookingId: string,
    userId: string,
    organizationId: string
  ): Promise<IBooking> {
    const booking = await Booking.findOne({
      _id: bookingId,
      organizationId,
      userId: new Types.ObjectId(userId),
      status: 'CONFIRMED',
    });

    if (!booking) {
      throw new NotFoundError('Booking');
    }

    const now = new Date();
    if (booking.startTime <= now) {
      throw new ValidationError('Cannot cancel past or ongoing bookings');
    }

    booking.status = 'CANCELLED';
    booking.cancelledAt = new Date();
    booking.cancelledBy = new Types.ObjectId(userId);
    await booking.save();

    return booking;
  }

  async getBookings(
    organizationId: string,
    filters: {
      resourceId?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    }
  ) {
    const query: any = {
      organizationId,
      isDeleted: false,
    };

    if (filters.resourceId) {
      query.resourceId = new Types.ObjectId(filters.resourceId);
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      query.startTime = {};
      if (filters.startDate) {
        query.startTime.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.startTime.$lte = filters.endDate;
      }
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('resourceId', 'name type')
        .populate('userId', 'firstName lastName email')
        .sort({ startTime: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Booking.countDocuments(query),
    ]);

    return {
      bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}