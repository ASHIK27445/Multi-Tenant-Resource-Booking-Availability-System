import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { environment } from '../config/environment';
import { UnauthorizedError, ForbiddenError } from '../shared/errors/AppError';
import { User, IUser } from '../modules/auth/user.model';

export interface JwtPayload {
  userId: string;
  email: string;
  organizationId: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, environment.JWT_SECRET) as JwtPayload;
    
    // verifying that use exist and isActive
    const user = await User.findOne({
      _id: decoded.userId,
      organizationId: decoded.organizationId,
      isActive: true,
    });

    if (!user) {
      throw new UnauthorizedError('User no longer active');
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
    } else {
      next(error);
    }
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
};