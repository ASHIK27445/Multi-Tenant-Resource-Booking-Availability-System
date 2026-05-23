import { Request, Response, NextFunction } from 'express';
import { AvailabilityService } from './availability.service';

export class AvailabilityController {
  private availabilityService: AvailabilityService;

  constructor() {
    this.availabilityService = new AvailabilityService();
  }

  getAvailability = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const availability = await this.availabilityService.getAvailability({
        ...req.query,
        organizationId: req.user!.organizationId,
      } as any);

      res.json({
        success: true,
        data: availability,
      });
    } catch (error) {
      next(error);
    }
  };
}