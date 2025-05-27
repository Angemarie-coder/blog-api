import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Post from '../models/Post';

interface JwtPayload {
  id: number;
}

// Use the User model's attributes type
type UserAttributes = InstanceType<typeof User>;

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: Partial<UserAttributes>;
    }
  }
}
// Protect routes
export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

      // Get user from the token
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        res.status(401).json({ message: 'Not authorized, user not found' });
        return;
      }

      req.user = user;

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Check if user is author
export const isAuthor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const post = await Post.findByPk(req.params.id);
    
    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }
    
    // Replace 'authorId' with the correct property name from your Post model, e.g., 'userId'
    if ((post as any).authorId?.toString() !== req.user?.id?.toString()) {
      res.status(403).json({ message: 'Not authorized, not the author' });
      return;
    }
    
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};