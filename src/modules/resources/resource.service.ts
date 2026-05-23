import { Types } from 'mongoose';
import { Resource, IResource } from './resource.model';
import { Booking } from '../bookings/booking.model';
import { NotFoundError, ConflictError, ValidationError } from '../../shared/errors/AppError';

export class ResourceService {
  async createResource(
    resourceData: Partial<IResource>,
    organizationId: string
  ): Promise<IResource> {
    const existingResource = await Resource.findOne({
      name: resourceData.name,
      organizationId,
      isDeleted: false,
    });

    if (existingResource) {
      throw new ConflictError('Resource with this name already exists in your organization');
    }

    if (resourceData.bufferTimeMinutes !== undefined) {
      if (resourceData.bufferTimeMinutes < 0 || resourceData.bufferTimeMinutes > 120) {
        throw new ValidationError('Buffer time must be between 0 and 120 minutes');
      }
    }

    const resource = await Resource.create({
      ...resourceData,
      organizationId,
    });

    return resource;
  }

  async getResources(
    organizationId: string,
    filters: {
      type?: string;
      isActive?: boolean;
      page?: number;
      limit?: number;
    }
  ) {
    const query: any = {
      organizationId,
      isDeleted: false,
    };

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [resources, total] = await Promise.all([
      Resource.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Resource.countDocuments(query),
    ]);

    return {
      resources,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getResourceById(resourceId: string, organizationId: string): Promise<IResource> {
    const resource = await Resource.findOne({
      _id: resourceId,
      organizationId,
      isDeleted: false,
    });

    if (!resource) {
      throw new NotFoundError('Resource');
    }

    return resource;
  }

  async updateResource(
    resourceId: string,
    updateData: Partial<IResource>,
    organizationId: string
  ): Promise<IResource> {
    const resource = await Resource.findOne({
      _id: resourceId,
      organizationId,
      isDeleted: false,
    });

    if (!resource) {
      throw new NotFoundError('Resource');
    }

    if (updateData.name && updateData.name !== resource.name) {
      const existingResource = await Resource.findOne({
        name: updateData.name,
        organizationId,
        _id: { $ne: resourceId },
        isDeleted: false,
      });

      if (existingResource) {
        throw new ConflictError('Resource with this name already exists');
      }
    }

    // Validate buffer time
    if (updateData.bufferTimeMinutes !== undefined) {
      if (updateData.bufferTimeMinutes < 0 || updateData.bufferTimeMinutes > 120) {
        throw new ValidationError('Buffer time must be between 0 and 120 minutes');
      }
    }

    Object.assign(resource, updateData);
    await resource.save();

    return resource;
  }

  async softDeleteResource(resourceId: string, organizationId: string): Promise<void> {
    const resource = await Resource.findOne({
      _id: resourceId,
      organizationId,
      isDeleted: false,
    });

    if (!resource) {
      throw new NotFoundError('Resource');
    }

    const activeBookings = await Booking.countDocuments({
      resourceId: new Types.ObjectId(resourceId),
      organizationId,
      status: 'CONFIRMED',
      isDeleted: false,
      startTime: { $gt: new Date() }, 
    });

    if (activeBookings > 0) {
      throw new ConflictError(
        `Cannot delete resource with ${activeBookings} active future booking(s). Cancel them first.`
      );
    }

    // Soft delete
    resource.isDeleted = true;
    resource.deletedAt = new Date();
    resource.isActive = false;
    await resource.save();
  }
}