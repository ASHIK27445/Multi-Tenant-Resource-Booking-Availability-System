import * as jwt from 'jsonwebtoken';
import { User, IUser } from './user.model';
import { environment } from '../../config/environment';
import { AppError, UnauthorizedError, NotFoundError } from '../../shared/errors/AppError';

export class AuthService {
  async register(userData: Partial<IUser>): Promise<{ user: Partial<IUser>; token: string }> {
    const existingUser = await User.findOne({
      email: userData.email,
      organizationId: userData.organizationId,
    });

    if (existingUser) {
      throw new AppError('User already exists in this organization', 409);
    }

    const user = await User.create(userData);
    const token = this.generateToken(user);

    return { user, token };
  }

  async login(email: string, password: string, organizationId: string): Promise<{ user: Partial<IUser>; token: string }> {
    const user = await User.findOne({ email, organizationId }).select('+password');
    
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const token = this.generateToken(user);
    const { password: _, ...userWithoutPassword } = user.toObject();

    return { user: userWithoutPassword as Partial<IUser>, token };
  }

  async getUserById(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }
    return user;
  }

  private generateToken(user: IUser): string {
    const payload = {
      userId: (user as any)._id?.toString ? (user as any)._id.toString() : (user as any)._id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
    };

    const options: jwt.SignOptions = {
      expiresIn: environment.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    };

    return jwt.sign(payload, environment.JWT_SECRET as jwt.Secret, options);
  }
}