import express, { Router } from 'express';
import { 
  getAllUsers, 
  search, 
  getById, 
  updateUser, 
  deleteUser 
} from '../controllers/users.controller';
import { authenticated } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validation.middleware';
import { 
  getUserByIdSchema, 
  updateUserSchema, 
  deleteUserSchema, 
  searchUsersSchema 
} from '../schema/user.schemas';

const router: Router = express.Router();

// Public routes
router.get('/search', validate(searchUsersSchema), search);

// Protected routes - require authentication
router.use(authenticated);

// Any authenticated user can view user details
router.get('/:id', validate(getUserByIdSchema), getById);

// Only admins can update or delete users
router.get('/', 
    authorize(['admin']),
    getAllUsers
);

router.put('/:id', 
  authorize(['admin']), 
  validate(updateUserSchema), 
  updateUser
);

router.delete('/:id', 
  authorize(['admin']), 
  validate(deleteUserSchema), 
  deleteUser
);

export default router;