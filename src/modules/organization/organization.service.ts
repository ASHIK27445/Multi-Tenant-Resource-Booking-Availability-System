import { Organization, IOrganization } from './organization.model';
import { DateTimeUtils } from '../../shared/utils/dateTime.utils';
import { NotFoundError, ValidationError, AppError } from '../../shared/errors/AppError';

export class OrganizationService {
  async createOrganization(orgData: Partial<IOrganization>): Promise<IOrganization> {
    if (!DateTimeUtils.validateTimezone(orgData.timezone!)) {
      throw new ValidationError('Invalid timezone');
    }

    if (orgData.workingHours) {
      this.validateWorkingHours(orgData.workingHours);
    }

    const existingOrg = await Organization.findOne({ name: orgData.name });
    if (existingOrg) {
      throw new AppError('Organization with this name already exists', 409);
    }

    const organization = await Organization.create(orgData);
    return organization;
  }

  async getOrganizationById(organizationId: string): Promise<IOrganization> {
    const organization = await Organization.findById(organizationId);
    
    if (!organization) {
      throw new NotFoundError('Organization');
    }

    return organization;
  }

  async updateOrganization(
    organizationId: string,
    updateData: Partial<IOrganization>
  ): Promise<IOrganization> {
    const organization = await Organization.findById(organizationId);
    
    if (!organization) {
      throw new NotFoundError('Organization');
    }


    if (updateData.timezone && !DateTimeUtils.validateTimezone(updateData.timezone)) {
      throw new ValidationError('Invalid timezone');
    }


    if (updateData.workingHours) {
      this.validateWorkingHours(updateData.workingHours);
    }

    if (updateData.name && updateData.name !== organization.name) {
      const existingOrg = await Organization.findOne({ 
        name: updateData.name,
        _id: { $ne: organizationId }
      });
      
      if (existingOrg) {
        throw new AppError('Organization with this name already exists', 409);
      }
    }

    Object.assign(organization, updateData);
    await organization.save();

    return organization;
  }

  private validateWorkingHours(workingHours: any[]): void {
    const hasWorkingDay = workingHours.some((wh) => wh.isWorkingDay);
    if (!hasWorkingDay) {
      throw new ValidationError('Organization must have at least one working day');
    }

    for (const wh of workingHours) {
      if (wh.isWorkingDay) {
        if (!DateTimeUtils.isValidTimeString(wh.startTime)) {
          throw new ValidationError(`Invalid start time format for day ${wh.dayOfWeek}`);
        }
        if (!DateTimeUtils.isValidTimeString(wh.endTime)) {
          throw new ValidationError(`Invalid end time format for day ${wh.dayOfWeek}`);
        }

        const [startHour, startMinute] = wh.startTime.split(':').map(Number);
        const [endHour, endMinute] = wh.endTime.split(':').map(Number);
        
        if (endHour < startHour || (endHour === startHour && endMinute <= startMinute)) {
          throw new ValidationError(
            `End time must be after start time for day ${wh.dayOfWeek}`
          );
        }
      }
    }
  }
}