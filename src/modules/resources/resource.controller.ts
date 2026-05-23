import { Request, Response, NextFunction } from 'express';
import { ResourceService } from './resource.service';

export class ResourceController {
  private resourceService: ResourceService;

  constructor() {
    this.resourceService = new ResourceService();
  }

  createResource = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resource = await this.resourceService.createResource(
        req.body,
        req.user!.organizationId
      );

      res.status(201).json({
        success: true,
        data: resource,
      });
    } catch (error) {
      next(error);
    }
  };

  getResources = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.resourceService.getResources(
        req.user!.organizationId,
        {
          type: req.query.type as string,
          isActive: req.query.isActive === undefined ? undefined : req.query.isActive === 'true',
          page: req.query.page ? parseInt(req.query.page as string) : undefined,
          limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        }
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  getResource = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resource = await this.resourceService.getResourceById(
        req.params.id,
        req.user!.organizationId
      );

      res.json({
        success: true,
        data: resource,
      });
    } catch (error) {
      next(error);
    }
  };

  updateResource = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resource = await this.resourceService.updateResource(
        req.params.id,
        req.body,
        req.user!.organizationId
      );

      res.json({
        success: true,
        data: resource,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteResource = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.resourceService.softDeleteResource(
        req.params.id,
        req.user!.organizationId
      );

      res.json({
        success: true,
        message: 'Resource deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}