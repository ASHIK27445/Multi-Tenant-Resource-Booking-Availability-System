import { Request, Response, NextFunction } from 'express';
import { BookingService } from './booking.service';

export class BookingController {
  private bookingService: BookingService;

  constructor() {
    this.bookingService = new BookingService();
  }

  createBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const booking = await this.bookingService.createBooking(
        req.body,
        req.user!.userId,
        req.user!.organizationId
      );

      res.status(201).json({
        success: true,
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  };

  cancelBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const booking = await this.bookingService.cancelBooking(
        req.params.id,
        req.user!.userId,
        req.user!.organizationId
      );

      res.json({
        success: true,
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  };

  getBookings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.bookingService.getBookings(
        req.user!.organizationId,
        {
          ...req.query,
          page: req.query.page ? parseInt(req.query.page as string) : undefined,
          limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        } as any
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };
}