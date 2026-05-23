import { DateTime, IANAZone, Settings } from 'luxon';

export class DateTimeUtils {
  static validateTimezone(timezone: string): boolean {
    return IANAZone.isValidZone(timezone);
  }

  static createInTimezone(date: Date | string, timezone: string): DateTime {
    const dt = typeof date === 'string' ? DateTime.fromISO(date) : DateTime.fromJSDate(date);
    return dt.setZone(timezone);
  }

  static getCurrentTimeInTimezone(timezone: string): DateTime {
    return DateTime.now().setZone(timezone);
  }

  static formatToTimeString(dt: DateTime): string {
    return dt.toFormat('HH:mm');
  }

  static combineDateAndTime(date: DateTime, timeString: string): DateTime {
    const [hours, minutes] = timeString.split(':').map(Number);
    return date.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
  }

  static getStartOfDay(dt: DateTime): DateTime {
    return dt.startOf('day');
  }

  static getEndOfDay(dt: DateTime): DateTime {
    return dt.endOf('day');
  }

  static addMinutes(dt: DateTime, minutes: number): DateTime {
    return dt.plus({ minutes });
  }

  static differenceInMinutes(dt1: DateTime, dt2: DateTime): number {
    return dt1.diff(dt2, 'minutes').minutes;
  }

  static isValidTimeString(time: string): boolean {
    const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
  }

  static generateTimeSlots(
    startTime: DateTime,
    endTime: DateTime,
    durationMinutes: number,
    bufferMinutes: number = 0
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    let current = startTime;
    const totalSlotDuration = durationMinutes + bufferMinutes;

    while (current.plus({ minutes: durationMinutes }) <= endTime) {
      slots.push({
        start: current.toJSDate(),
        end: current.plus({ minutes: durationMinutes }).toJSDate(),
      });
      current = current.plus({ minutes: totalSlotDuration });
    }

    return slots;
  }
}

export interface TimeSlot {
  start: Date;
  end: Date;
}