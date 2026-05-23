import { DateTime, Interval } from 'luxon';
import { Types } from 'mongoose';
import { Booking, IBooking } from '../bookings/booking.model';
import { Resource, IResource } from '../resources/resource.model';
import { Organization } from '../organization/organization.model';
import { DateTimeUtils, TimeSlot } from '../../shared/utils/dateTime.utils';
import { NotFoundError, ValidationError } from '../../shared/errors/AppError';
import { WorkingHours, BookingPolicy } from '../../shared/types/common.types';

interface AvailabilitySlot {
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  isWithinWorkingHours: boolean;
}

interface AvailabilityQuery {
  resourceId: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  durationMinutes?: number;
  organizationId: string;
}

interface DateAvailability {
  date: string;
  timezone: string;
  workingHours: {
    start: string;
    end: string;
  };
  totalSlots: number;
  availableSlots: AvailabilitySlot[];
}

type LeanBooking = Pick<IBooking, 'startTime' | 'endTime' | '_id'> & {
  _id: Types.ObjectId;
}

export class AvailabilityService {
  async getAvailability(query: AvailabilityQuery): Promise<DateAvailability[]> {
    
    const [organization, resource] = await Promise.all([
      Organization.findById(query.organizationId)
        .select('timezone workingHours bookingPolicy')
        .lean(),
      Resource.findOne({
        _id: query.resourceId,
        organizationId: query.organizationId,
        isActive: true,
        isDeleted: false,
      })
        .select('name type bufferTimeMinutes')
        .lean(),
    ]);

    if (!organization) {
      throw new NotFoundError('Organization not found or inactive');
    }
    if (!resource) {
      throw new NotFoundError('Resource not found or inactive');
    }

    //Determine the date range to check
    const dateRange = this.determineDateRange(query, organization);
    if (dateRange.length === 0) {
      return [];
    }

    //Calculate effective buffer time
    const bufferMinutes = resource.bufferTimeMinutes ?? 
                         organization.bookingPolicy.bufferTimeMinutes;

    //Determine slot duration
    const durationMinutes = query.durationMinutes ?? 
                           organization.bookingPolicy.minDurationMinutes;

    //Validate duration against policy
    this.validateDuration(durationMinutes, organization.bookingPolicy);

    //Fetch all confirmed bookings for the resource in the date range
    const bookings = await this.fetchRelevantBookings(
      query.resourceId,
      query.organizationId,
      dateRange
    );

    // 7. Generate availability for each date
    const availability = this.generateAvailabilityForDateRange(
      dateRange,
      organization.workingHours,
      organization.timezone,
      organization.bookingPolicy,
      bookings,
      durationMinutes,
      bufferMinutes
    );

    return availability;
  }

  async checkSlotAvailability(
    resourceId: string,
    organizationId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string
  ): Promise<{ 
    isAvailable: boolean; 
    conflicts: Array<{
      id: string;
      startTime: Date;
      endTime: Date;
      title: string;
    }>;
  }> {
    const query: any = {
      resourceId: new Types.ObjectId(resourceId),
      organizationId: new Types.ObjectId(organizationId),
      status: 'CONFIRMED',
      isDeleted: false,

      $or: [
        {
          startTime: { $lt: endTime, $gte: startTime },
        },
        {
          endTime: { $gt: startTime, $lte: endTime },
        },
        {
          startTime: { $lte: startTime },
          endTime: { $gte: endTime },
        },
      ],
    };

    if (excludeBookingId) {
      query._id = { $ne: new Types.ObjectId(excludeBookingId) };
    }

    const conflicts = await Booking.find(query)
      .select('startTime endTime title')
      .lean()
      .exec();

    return {
      isAvailable: conflicts.length === 0,
      conflicts: conflicts.map((c: any) => ({
        id: c._id.toString(),
        startTime: c.startTime,
        endTime: c.endTime,
        title: c.title,
      })),
    };
  }

  async getBusySlots(
    resourceId: string,
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ startTime: Date; endTime: Date }>> {
    const bookings = await Booking.find({
      resourceId: new Types.ObjectId(resourceId),
      organizationId: new Types.ObjectId(organizationId),
      status: 'CONFIRMED',
      isDeleted: false,
      startTime: { $lt: endDate },
      endTime: { $gt: startDate },
    })
      .select('startTime endTime -_id')
      .sort({ startTime: 1 })
      .lean()
      .exec();

    return bookings.map((b: any) => ({
      startTime: b.startTime,
      endTime: b.endTime,
    }));
  }


  private determineDateRange(
    query: AvailabilityQuery,
    organization: any
  ): string[] {
    const timezone = organization.timezone;
    const now = DateTimeUtils.getCurrentTimeInTimezone(timezone);
    
    let startDate: DateTime;
    let endDate: DateTime;

    if (query.date) {
      // Single date query
      startDate = DateTimeUtils.createInTimezone(query.date, timezone).startOf('day');
      endDate = startDate.endOf('day');
    } else if (query.startDate && query.endDate) {
      // Custom date range
      startDate = DateTimeUtils.createInTimezone(query.startDate, timezone).startOf('day');
      endDate = DateTimeUtils.createInTimezone(query.endDate, timezone).endOf('day');
      
      // Validate range
      if (endDate < startDate) {
        throw new ValidationError('End date must be after start date');
      }
    } else {
      // Default: next 7 days from today
      startDate = now.startOf('day');
      endDate = now.plus({ days: 7 }).endOf('day');
    }

    // Apply advance booking limit
    const maxAdvanceDate = now.plus({ 
      days: organization.bookingPolicy.maxAdvanceBookingDays 
    }).endOf('day');
    
    if (endDate > maxAdvanceDate) {
      endDate = maxAdvanceDate;
    }

    // Don't allow dates in the past
    if (endDate < now.startOf('day')) {
      return [];
    }

    if (startDate < now.startOf('day')) {
      startDate = now.startOf('day');
    }

    // Generate array of working dates
    const dates: string[] = [];
    let current = startDate;

    while (current <= endDate) {
      // Convert Luxon weekday (1-7, Monday=1) to JavaScript weekday (0-6, Sunday=0)
      const dayOfWeek = (current.weekday % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
      
      const workingDayConfig = organization.workingHours.find(
        (wh: WorkingHours) => wh.dayOfWeek === dayOfWeek
      );

      // Only include working days
      if (workingDayConfig?.isWorkingDay) {
        dates.push(current.toISODate()!);
      }
      
      current = current.plus({ days: 1 });
    }

    return dates;
  }

 
  private validateDuration(
    durationMinutes: number,
    bookingPolicy: BookingPolicy
  ): void {
    if (durationMinutes < bookingPolicy.minDurationMinutes) {
      throw new ValidationError(
        `Minimum booking duration is ${bookingPolicy.minDurationMinutes} minutes`
      );
    }

    if (durationMinutes > bookingPolicy.maxDurationMinutes) {
      throw new ValidationError(
        `Maximum booking duration is ${bookingPolicy.maxDurationMinutes} minutes`
      );
    }
  }


  private async fetchRelevantBookings(
    resourceId: string,
    organizationId: string,
    dates: string[]
  ): Promise<LeanBooking[]> {
    if (dates.length === 0) return [];

    // Convert date strings to JS Date objects for MongoDB query
    const startDate = new Date(dates[0] + 'T00:00:00.000Z');
    const endDate = new Date(dates[dates.length - 1] + 'T23:59:59.999Z');

    // Query with index-friendly conditions
    return Booking.find({
      resourceId: new Types.ObjectId(resourceId),
      organizationId: new Types.ObjectId(organizationId),
      status: 'CONFIRMED',
      isDeleted: false,
      startTime: { $lt: endDate },
      endTime: { $gt: startDate },
    })
      .select('startTime endTime')
      .sort({ startTime: 1 })
      .lean()
      .exec() as unknown as LeanBooking[];
  }


  private generateAvailabilityForDateRange(
    dates: string[],
    workingHours: WorkingHours[],
    timezone: string,
    bookingPolicy: BookingPolicy,
    bookings: LeanBooking[],
    durationMinutes: number,
    bufferMinutes: number
  ): DateAvailability[] {
    const now = DateTimeUtils.getCurrentTimeInTimezone(timezone);
    const result: DateAvailability[] = [];

    for (const dateStr of dates) {
      const dateAvailability = this.generateAvailabilityForSingleDate(
        dateStr,
        workingHours,
        timezone,
        bookingPolicy,
        bookings,
        durationMinutes,
        bufferMinutes,
        now
      );

      if (dateAvailability && dateAvailability.availableSlots.length > 0) {
        result.push(dateAvailability);
      }
    }

    return result;
  }


  private generateAvailabilityForSingleDate(
    dateStr: string,
    workingHours: WorkingHours[],
    timezone: string,
    bookingPolicy: BookingPolicy,
    bookings: LeanBooking[],
    durationMinutes: number,
    bufferMinutes: number,
    now: DateTime
  ): DateAvailability | null {
    const date = DateTimeUtils.createInTimezone(dateStr, timezone);
    const dayOfWeek = (date.weekday % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6;

    // Find working hours for this day of week
    const workingDayConfig = workingHours.find(
      (wh) => wh.dayOfWeek === dayOfWeek
    );

    if (!workingDayConfig?.isWorkingDay) {
      return null;
    }

    // Parse working hours
    const workStart = DateTimeUtils.combineDateAndTime(
      date,
      workingDayConfig.startTime
    );
    const workEnd = DateTimeUtils.combineDateAndTime(
      date,
      workingDayConfig.endTime
    );

    // Skip if the entire working day has passed
    if (workEnd <= now) {
      return null;
    }

    // Adjust start time for today's bookings (respect minimum advance hours)
    let effectiveStart = workStart;
    if (date.hasSame(now, 'day')) {
      const minimumStartTime = now.plus({ 
        hours: bookingPolicy.minAdvanceBookingHours 
      });
      
      // Round up to the nearest slot boundary
      const roundedMinutes = Math.ceil(minimumStartTime.minute / 15) * 15;
      const roundedStartTime = minimumStartTime.set({ 
        minute: roundedMinutes, 
        second: 0, 
        millisecond: 0 
      });
      
      effectiveStart = roundedStartTime > workStart ? roundedStartTime : workStart;
      
      // If effective start is past working hours, skip this date
      if (effectiveStart >= workEnd) {
        return null;
      }
    }

    const dateBookings = bookings.filter((booking) => {
      const bookingDate = DateTime.fromJSDate(booking.startTime).setZone(timezone);
      return bookingDate.hasSame(date, 'day');
    });

    const availableSlots = this.calculateAvailableSlots(
      effectiveStart,
      workEnd,
      dateBookings,
      durationMinutes,
      bufferMinutes
    );

    return {
      date: dateStr,
      timezone,
      workingHours: {
        start: workingDayConfig.startTime,
        end: workingDayConfig.endTime,
      },
      totalSlots: availableSlots.length,
      availableSlots,
    };
  }


  private calculateAvailableSlots(
    workStart: DateTime,
    workEnd: DateTime,
    bookings: LeanBooking[],
    durationMinutes: number,
    bufferMinutes: number
  ): AvailabilitySlot[] {
    const timezone = workStart.zoneName || 'UTC';

    // Create blocked intervals from bookings with buffer zones
    const blockedIntervals = this.createBlockedIntervals(
      bookings,
      bufferMinutes,
      timezone,
      workStart,
      workEnd
    );

    const mergedBlockedIntervals = this.mergeOverlappingIntervals(blockedIntervals);

    const availableGaps = this.findAvailableGaps(
      workStart,
      workEnd,
      mergedBlockedIntervals
    );

    const allSlots: AvailabilitySlot[] = [];
    
    for (const gap of availableGaps) {
      const gapSlots = this.generateSlotsInInterval(
        gap.start,
        gap.end,
        durationMinutes
      );
      allSlots.push(...gapSlots);
    }

    return this.deduplicateAndSortSlots(allSlots);
  }


  private createBlockedIntervals(
    bookings: LeanBooking[],
    bufferMinutes: number,
    timezone: string,
    dayStart: DateTime,
    dayEnd: DateTime
  ): Interval[] {
    const intervals: Interval[] = [];

    for (const booking of bookings) {
      const bookingStart = DateTime.fromJSDate(booking.startTime).setZone(timezone);
      const bookingEnd = DateTime.fromJSDate(booking.endTime).setZone(timezone);

      let blockedStart = bookingStart.minus({ minutes: bufferMinutes });
      let blockedEnd = bookingEnd.plus({ minutes: bufferMinutes });

      if (blockedStart < dayStart) {
        blockedStart = dayStart;
      }
      if (blockedEnd > dayEnd) {
        blockedEnd = dayEnd;
      }

      if (blockedStart < blockedEnd) {
        const interval = Interval.fromDateTimes(blockedStart, blockedEnd);
        if (interval.isValid) {
          intervals.push(interval);
        }
      }
    }

    return intervals;
  }

  private mergeOverlappingIntervals(intervals: Interval[]): Interval[] {
    if (intervals.length <= 1) return intervals;

    intervals.sort((a, b) => {
      const aStart = a.start;
      const bStart = b.start;
      if (!aStart || !bStart) return 0;
      return aStart.toMillis() - bStart.toMillis();
    });

    const merged: Interval[] = [];
    let current = intervals[0];

    for (let i = 1; i < intervals.length; i++) {
      const next = intervals[i];

      if (!current || !next) continue;

      if (current.overlaps(next) || (current.end && next.start && current.end.equals(next.start))) {
        const mergedStart = current.start && next.start ? 
          (current.start < next.start ? current.start : next.start) : 
          (current.start || next.start);
        const mergedEnd = current.end && next.end ? 
          (current.end > next.end ? current.end : next.end) : 
          (current.end || next.end);

        if (mergedStart && mergedEnd) {
          current = Interval.fromDateTimes(mergedStart, mergedEnd);
        }
      } else {
        merged.push(current);
        current = next;
      }
    }

    if (current) {
      merged.push(current);
    }
    
    return merged;
  }


  private findAvailableGaps(
    dayStart: DateTime,
    dayEnd: DateTime,
    blockedIntervals: Interval[]
  ): Array<{ start: DateTime; end: DateTime }> {
    const gaps: Array<{ start: DateTime; end: DateTime }> = [];
    let currentTime = dayStart;

    for (const blocked of blockedIntervals) {
      const blockStart = blocked.start;
      const blockEnd = blocked.end;
      
      if (!blockStart || !blockEnd) continue;

      if (currentTime < blockStart) {
        gaps.push({
          start: currentTime,
          end: blockStart,
        });
      }

      if (blockEnd > currentTime) {
        currentTime = blockEnd;
      }
    }

    if (currentTime < dayEnd) {
      gaps.push({
        start: currentTime,
        end: dayEnd,
      });
    }

    return gaps;
  }

  private generateSlotsInInterval(
    intervalStart: DateTime,
    intervalEnd: DateTime,
    durationMinutes: number
  ): AvailabilitySlot[] {
    const slots: AvailabilitySlot[] = [];
    let currentStart = intervalStart;

    while (currentStart.plus({ minutes: durationMinutes }) <= intervalEnd) {
      const slotEnd = currentStart.plus({ minutes: durationMinutes });

      slots.push({
        startTime: currentStart.toJSDate(),
        endTime: slotEnd.toJSDate(),
        durationMinutes,
        isWithinWorkingHours: true,
      });

      currentStart = currentStart.plus({ minutes: 15 });
    }

    return slots;
  }

  private deduplicateAndSortSlots(slots: AvailabilitySlot[]): AvailabilitySlot[] {
    const uniqueMap = new Map<string, AvailabilitySlot>();

    for (const slot of slots) {
      const key = `${slot.startTime.toISOString()}_${slot.endTime.toISOString()}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, slot);
      }
    }

    return Array.from(uniqueMap.values()).sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );
  }

  async getMultipleResourcesAvailability(
    resourceIds: string[],
    organizationId: string,
    date: string,
    durationMinutes: number
  ): Promise<Array<{
    resourceId: string;
    resourceName: string;
    availableSlots: AvailabilitySlot[];
  }>> {
    const results = await Promise.allSettled(
      resourceIds.map(resourceId =>
        this.getAvailability({
          resourceId,
          organizationId,
          date,
          durationMinutes,
        })
      )
    );

    const availabilityMap = new Map<string, any>();
    
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled' && result.value.length > 0) {
        availabilityMap.set(resourceIds[i], result.value[0].availableSlots);
      }
    }

    const resources = await Resource.find({
      _id: { $in: resourceIds.map(id => new Types.ObjectId(id)) },
    })
      .select('name')
      .lean()
      .exec();

    return resources.map((resource: any) => ({
      resourceId: resource._id.toString(),
      resourceName: resource.name,
      availableSlots: availabilityMap.get(resource._id.toString()) || [],
    }));
  }

  async getNextAvailableSlot(
    resourceId: string,
    organizationId: string,
    durationMinutes: number
  ): Promise<AvailabilitySlot | null> {
    const organization = await Organization.findById(organizationId)
      .select('timezone bookingPolicy')
      .lean()
      .exec();

    if (!organization) {
      throw new NotFoundError('Organization');
    }

    const timezone = organization.timezone;
    const now = DateTimeUtils.getCurrentTimeInTimezone(timezone);
    
    const availability = await this.getAvailability({
      resourceId,
      organizationId,
      startDate: now.toISODate()!,
      endDate: now.plus({ days: 30 }).toISODate()!,
      durationMinutes,
    });

    for (const dateAvailability of availability) {
      if (dateAvailability.availableSlots.length > 0) {
        return dateAvailability.availableSlots[0];
      }
    }

    return null;
  }
}