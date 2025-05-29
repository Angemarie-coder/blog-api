import { Response, NextFunction } from 'express';
import { UserService } from '../services/users.service';
import { asyncHandler } from '../middleware/errorHandler';
import { 
  UpdateUserInput, 
  GetUserByIdInput, 
  SearchUsersInput, 
  DeleteUserInput 
} from '../schema/user.schemas';
import { AuthenticatedRequest, ApiResponse } from '../types/common.types';
import { NotFoundError, ConflictError } from '../utils/errors';

const userService = new UserService();

export const getAllUsers = asyncHandler(async (
  req: AuthenticatedRequest, 
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  const users = await userService.findAll();
  
  res.json({
    success: true,
    message: 'Users retrieved successfully',
    data: { users }
  });
});

export const search = asyncHandler(async (
  req: AuthenticatedRequest & SearchUsersInput, 
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  const { name } = req.query;
  
  const users = name ? await userService.findByName(name) : [];
  
  res.json({
    success: true,
    message: 'Search completed successfully',
    data: { users, count: users.length }
  });
});

export const getById = asyncHandler(async (
  req: AuthenticatedRequest & GetUserByIdInput, 
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  const { id } = req.params;
  
  const user = await userService.findById(id);
  if (!user) {
    throw new NotFoundError('User');
  }
  
  res.json({
    success: true,
    message: 'User retrieved successfully',
    data: { user }
  });
});

export const updateUser = asyncHandler(async (
  req: AuthenticatedRequest & UpdateUserInput, 
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  const { id } = req.params;
  const updateData = req.body;

  // Check if user exists
  const existingUser = await userService.findById(id);
  if (!existingUser) {
    throw new NotFoundError('User');
  }

  // Check email uniqueness if email is being updated
  if (updateData.email && updateData.email !== existingUser.email) {
    const userWithEmail = await userService.findByEmail(updateData.email);
    if (userWithEmail) {
      throw new ConflictError('Email is already in use');
    }
  }
  
  const updatedUser = await userService.update(id, updateData);
  
  res.json({
    success: true,
    message: 'User updated successfully',
    data: { user: updatedUser }
  });
});

export const deleteUser = asyncHandler(async (
  req: AuthenticatedRequest & DeleteUserInput, 
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  const { id } = req.params;
  
  const user = await userService.findById(id);
  if (!user) {
    throw new NotFoundError('User');
  }
  
  const deleted = await userService.delete(id);
  if (!deleted) {
    throw new Error('Failed to delete user');
  }
  
  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});