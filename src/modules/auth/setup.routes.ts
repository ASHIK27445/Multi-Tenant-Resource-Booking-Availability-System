import { Router, Request, Response, NextFunction } from 'express';
import { User } from './user.model';
import jwt from 'jsonwebtoken';
import { environment } from '../../config/environment';

const router = Router();

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password, firstName, lastName, role, organizationId } = req.body;

        const existingUser = await User.findOne({ email, organizationId });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User already exists'
            });
        }

        const user = await User.create({
            email,
            password,
            firstName,
            lastName,
            role,
            organizationId,
            isActive: true
        });

        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                organizationId: user.organizationId,
                role: user.role,
            },
            environment.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    organizationId: user.organizationId
                },
                token
            }
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

export { router as setupRoutes };