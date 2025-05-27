import express from 'express';
import {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost
} from '../controllers/postsController';
import { protect, isAuthor } from '../middleware/auth';

const router = express.Router();

router.route('/posts')
  .post(protect, createPost)
  .get(getPosts);

router.route('/posts/:id')
  .get(getPostById)
  .put(protect, isAuthor, updatePost)
  .delete(protect, isAuthor, deletePost);

export default router;