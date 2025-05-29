import express from 'express';
import {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost
} from '../controllers/post.controller';
import { authorize, isAuthor } from '../middleware/authorize';

const router = express.Router();

router.route('/posts')
  .post(authorize, createPost)
  .get(getPosts);

router.route('/posts/:id')
  .get(getPostById)
  .put(authorize, isAuthor, updatePost)
  .delete(authorize, isAuthor, deletePost);

export default router;