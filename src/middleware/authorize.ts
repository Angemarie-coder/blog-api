import { Post } from '../models/Post';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AppDataSource } from '../config/database';

interface AuthRequest extends Request {
  user?: {
    id: number;
    role: 'user' | 'admin';
  };
}

export const authorize = (allowedRoles: ('user' | 'admin')[]): RequestHandler => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    console.log('Authorize middleware: user=', req.user); // Debug

    // If user is not authenticated
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    // If role is not authorized
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: 'This user has insufficient permission' });
      return;
    }

    next();
  };
};

// Check if user is author
export const isAuthor = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log(`isAuthor middleware: postId=${req.params.id}, userId=${req.user?.id}`);

    // Get the Post repository using AppDataSource
    const postRepository = AppDataSource.getRepository(Post);
    // Use findOneBy for newer TypeORM API
    const post = await postRepository.findOneBy({ id: parseInt(req.params.id) });

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    // Check if the authenticated user is the author
    if (post.author.id.toString() !== req.user?.id?.toString()) {
      res.status(403).json({ message: 'Not authorized, not the author' });
      return;
    }

    next();
  } catch (error) {
    console.error('Error in isAuthor middleware:', error);
    res.status(500).json({ message: 'Server error' });
  }
};