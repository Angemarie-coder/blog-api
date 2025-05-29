import { NextFunction, Request, RequestHandler, Response} from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { generateJWT, generateResetToken, generateVerifyToken } from '../utils/jwt';
import { sendResetPassword, sendVerification } from '../utils/email';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest, ApiResponse } from '../types/common.types';
import { ConflictError, NotFoundError, UnauthorizedError, ForbiddenError } from '../utils/errors';

import { AuthService } from '../services/auth.service';
import { UserService } from '../services/users.service';


import { 
    Register, 
    Login, 
    ForgotPassword, 
    ResetPassword, 
    VerifyEmail, 
  } from '../schema/auth.schemas';

  const authService = new AuthService 
  const userService = new UserService 


  //Create users
  export const register = asyncHandler(async (
      req: AuthenticatedRequest & Register, 
      res: Response<ApiResponse>,
      next: NextFunction
  ) => {
        const { name, email, password, role } = req.body;

        const existingUser = await userService.findByEmail(email);

        if (existingUser) {
            throw new ConflictError('User with this email already exists');
        }

        const newUser = await authService.create({ name, email, password, role });
        const token = generateVerifyToken({ userId: newUser.id, email: newUser.email });
        const verifyLink = `${process.env.FRONTEND_URL}/verify-email/${token}`;

       await sendVerification(newUser.email, verifyLink);
       
       res.status(201).json({
        success: true,
        message: 'User created successfully. Please check your email and verify your account.',
        data: {
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role
          }
        }
      });
}) as RequestHandler;

//Verify email
export const verifyEmail = asyncHandler(async (
    req: AuthenticatedRequest & VerifyEmail, 
    res: Response<ApiResponse>,
    next: NextFunction
  ) => {
    const { token } = req.params;
  
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    const user = await userService.findById(payload.userId);
    
    if (!user) {
      throw new NotFoundError('User');
    }
  
    if (user.isVerified) {
      throw new ConflictError('Email is already verified');
    }
  
    await userService.update(user.id, { isVerified: true });
  
    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  });

//Login
export const login = asyncHandler(async (
    req: AuthenticatedRequest & Login, 
    res: Response<ApiResponse>,
    next: NextFunction
  ) => {
    const { email, password } = req.body;
  
    const user = await authService.login(email, password);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }
  
    if (!user.isVerified) {
      throw new ForbiddenError('Please verify your email before logging in');
    }
  
    if (!user.isActive) {
      throw new ForbiddenError('Your account has been deactivated');
    }
  
    const token = generateJWT(user);
  
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role 
        },
        token
      }
    });
  });
  


//forgot Password
export const forgotPassword = asyncHandler(async (
    req: AuthenticatedRequest & ForgotPassword, 
    res: Response<ApiResponse>,
    next: NextFunction
  ) => {
    const { email } = req.body;
  
    const user = await userService.findByEmail(email);
    if (!user) {
      throw new NotFoundError('No user found with that email address');
    }
  
    const token = generateResetToken(user.email);
    const resetLink = `${process.env.RESET_PASSWORD_URL}/${token}`;
  
    await sendResetPassword(email, resetLink);
  
    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email'
    });
  });

// Reset Password
export const resetPassword = asyncHandler(async (
    req: AuthenticatedRequest & ResetPassword, 
    res: Response<ApiResponse>,
    next: NextFunction
  ) => {
    const { token } = req.params;
    const { newPassword } = req.body;
  
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { email: string };
    const user = await userService.findByEmail(decoded.email);
  
    if (!user) {
      throw new NotFoundError('User');
    }
  
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userService.update(user.id, { password: hashedPassword });
  
    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  });