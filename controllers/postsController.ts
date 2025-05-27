import { Request, Response } from 'express';
import Post from '../models/Post';
import User from '../models/User';
import { paginate } from '../utils/pagination';

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, body } = req.body;

    if (!req.user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    if (!req.user.id) {
      res.status(400).json({ message: 'User ID is missing' });
      return;
    }
    
    const post = await Post.create({
      title,
      body,
      authorId: +req.user.id
    });

    res.status(201).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all posts with pagination
// @route   GET /api/posts
// @access  Public
export const getPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await paginate(Post, {
      page,
      limit,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single post by ID
// @route   GET /api/posts/:id
// @access  Public
export const getPostById = async (req: Request, res: Response): Promise<void> => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private (Owner only)
export const updatePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, body } = req.body;
    const post = await Post.findByPk(req.params.id) as any;

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    if (post.authorId !== req.user.id) {
      res.status(403).json({ message: 'Not authorized, not the author' });
      return;
    }

    post.title = title || post.title;
    post.body = body || post.body;

    const updatedPost = await post.save();
    res.json(updatedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private (Owner only)
export const deletePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const post = await Post.findByPk(req.params.id) as any;

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    if (post.authorId !== req.user.id) {
      res.status(403).json({ message: 'Not authorized, not the author' });
      return;
    }

    await post.destroy();
    res.json({ message: 'Post removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};