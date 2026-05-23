import { Request, Response, NextFunction } from 'express';
import { OrganizationService } from './organization.service';

export class OrganizationController {
  private organizationService: OrganizationService;

  constructor() {
    this.organizationService = new OrganizationService();
  }

  createOrganization = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organization = await this.organizationService.createOrganization(req.body);

      res.status(201).json({
        success: true,
        data: organization,
      });
    } catch (error) {
      next(error);
    }
  };

  getOrganization = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organization = await this.organizationService.getOrganizationById(
        req.params.id
      );

      res.json({
        success: true,
        data: organization,
      });
    } catch (error) {
      next(error);
    }
  };

  updateOrganization = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organization = await this.organizationService.updateOrganization(
        req.params.id,
        req.body
      );

      res.json({
        success: true,
        data: organization,
      });
    } catch (error) {
      next(error);
    }
  };

  getMyOrganization = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organization = await this.organizationService.getOrganizationById(
        req.user!.organizationId
      );

      res.json({
        success: true,
        data: organization,
      });
    } catch (error) {
      next(error);
    }
  };
}