import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import User from '../models/User';
import { sendResetEmail } from '../utils/email';

// Define request interfaces for type safety
interface RegisterRequest extends Request {
  body: { name: string; email: string; password: string };
}

interface LoginRequest extends Request {
  body: { email: string; password: string };
}

interface ForgotPasswordRequest extends Request {
  body: { email: string };
}

interface ResetPasswordRequest extends Request {
  body: { token: string; password: string };
}

// Generate JWT token
const generateToken = (id: number): string => {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || '30d') as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign({ id: id.toString() }, process.env.JWT_SECRET as string, options);
};

// @desc    Register a new user
// @route   POST /api/register
// @access  Public
export const register = async (req: RegisterRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findByEmail(email);

    if (userExists) {
      res.status(400).json({ message: 'User already exists here.' });
      return;
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user.id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Login user & get token
// @route   POST /api/login
// @access  Public
export const login = async (req: LoginRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findByEmail(email);

    if (user && (await user.matchPassword(password))) {
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user.id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.email) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const user = await User.findByEmail(req.user.email);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Request password reset
// @route   POST /api/forgot-password
// @access  Public
export const forgotPassword = async (req: ForgotPasswordRequest, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }

    // Check if user exists
    const user = await User.findByEmail(email);
    if (!user) {
      // Generic message to prevent email enumeration
      res.status(200).json({ message: 'If the email exists, a reset link has been sent' });
      return;
    }

    // Generate and store reset token
    const token = await user.createResetToken();

    // Send reset email
    await sendResetEmail(email, token);

    res.status(200).json({ message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reset password using token
// @route   POST /api/reset-password
// @access  Public
export const resetPassword = async (req: ResetPasswordRequest, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;

    // Validate input
    if (!token || !password) {
      res.status(400).json({ message: 'Token and password are required' });
      return;
    }

    // Verify reset token
    const resetToken = await User.findResetToken(token);
    if (!resetToken) {
      res.status(400).json({ message: 'Invalid or expired token' });
      return;
    }

    // Find user by ID
    const user = await User.findByPk(resetToken.user_id);
    if (!user) {
      res.status(400).json({ message: 'User not found' });
      return;
    }

    // Update password and delete token
    await user.updatePassword(password);
    await User.deleteResetToken(token);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};