
import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user, token } = await this.authService.register({
        ...req.body,
        organizationId: req.user?.organizationId, // For adding users to existing org
      });

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            organizationId: user.organizationId,
          },
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, organizationId } = req.body;
      const { user, token } = await this.authService.login(email, password, organizationId);

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            organizationId: user.organizationId,
          },
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.authService.getUserById(req.user!.userId);
      
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };
}