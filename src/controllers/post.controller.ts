import { Response, NextFunction } from 'express';
import { PostService } from '../services/posts.service';
import { asyncHandler } from '../middleware/errorHandler';
import { 
  CreatePostInput, 
  UpdatePostInput, 
  GetPostByIdInput, 
  SearchPostsInput 
} from '../schema/post.schema';
import { AuthenticatedRequest, ApiResponse } from '../types/common.types';
import { NotFoundError, UnauthorizedError } from '../utils/errors';

const postService = new PostService();

// @desc    Create a new post
// @route   POST /blog/posts
// @access  Private
export const createPost = asyncHandler(async (
  req: AuthenticatedRequest & CreatePostInput, 
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  console.log('Creating post with data:', req.body, 'User:', req.user);

  const { title, body } = req.body;

  if (!req.user) {
    throw new UnauthorizedError('User not found');
  }

  if (!req.user.id) {
    throw new Error('User ID is missing');
  }

  try {
    const post = await postService.create({
      title,
      body,
      authorId: +req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: { post }
    });
  } catch (error) {
    console.error('Error in createPost:', error);
    throw error;
  }
});

// @desc    Get all posts with pagination
// @route   GET /api/posts
// @access  Public
export const getPosts = asyncHandler(async (
  req: AuthenticatedRequest & SearchPostsInput, 
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  const { page = '1', limit = '10' } = req.query;

  const result = await postService.findAll({
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    include: [
      {
        model: 'User',
        as: 'author',
        attributes: ['id', 'name', 'email']
      }
    ]
  });

  res.json({
    success: true,
    message: 'Posts retrieved successfully',
    data: { posts: result.data, count: result.count, totalPages: result.totalPages }
  });
});

// @desc    Get single post by ID
// @route   GET /api/posts/:id
// @access  Public
export const getPostById = asyncHandler(async (
  req: AuthenticatedRequest & GetPostByIdInput, 
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  const { id } = req.params;

  const post = await postService.findById(+id, {
    include: [
      {
        model: 'User',
        as: 'author',
        attributes: ['id', 'name', 'email']
      }
    ]
  });

  if (!post) {
    throw new NotFoundError('Post');
  }

  res.json({
    success: true,
    message: 'Post retrieved successfully',
    data: { post }
  });
});

// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private (Owner only)
export const updatePost = asyncHandler(async (
  req: AuthenticatedRequest & UpdatePostInput, 
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  const { id } = req.params;
  const { title, body } = req.body;

  const post = await postService.findById(+id);
  if (!post) {
    throw new NotFoundError('Post');
  }

  if (!req.user) {
    throw new UnauthorizedError('User not found');
  }

  if (post.author.id !== req.user.id) {
    throw new UnauthorizedError('Not authorized, not the author');
  }

  const updatedPost = await postService.update(+id, { title, body });

  res.json({
    success: true,
    message: 'Post updated successfully',
    data: { post: updatedPost }
  });
});

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private (Owner only)
export const deletePost = asyncHandler(async (
  req: AuthenticatedRequest & GetPostByIdInput, 
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  const { id } = req.params;

  const post = await postService.findById(+id);
  if (!post) {
    throw new NotFoundError('Post');
  }

  if (!req.user) {
    throw new UnauthorizedError('User not found');
  }

  if (post.author.id !== req.user.id) {
    throw new UnauthorizedError('Not authorized, not the author');
  }

  const deleted = await postService.delete(+id);
  if (!deleted) {
    throw new Error('Failed to delete post');
  }

  res.json({
    success: true,
    message: 'Post deleted successfully'
  });
});