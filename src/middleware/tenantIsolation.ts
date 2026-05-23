import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../shared/errors/AppError';
import { Organization } from '../modules/organization/organization.model';

export const tenantIsolation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizationId = req.user?.organizationId;
    
    if (!organizationId) {
      throw new ForbiddenError('Organization context required');
    }

    // Verifying organization is active
    const organization = await Organization.findOne({
      _id: organizationId,
      isActive: true,
    });

    if (!organization) {
      throw new ForbiddenError('Organization is not active');
    }

    (req as any).organization = organization
    
    next();
  } catch (error) {
    next(error);
  }
};

export const addTenantFilter = (req: Request, query: any = {}) => {
  if (req.user?.organizationId) {
    return {
      ...query,
      organizationId: req.user.organizationId,
    };
  }
  return query;
};