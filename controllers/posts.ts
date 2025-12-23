import { createController } from "./base.js";
import { Post, IPost } from '../models/Post.js';
import express from 'express';

const postsController = createController<IPost>(Post);

const router = express.Router();

router.get('/', postsController.getAll.bind(postsController));

router.get('/:id', postsController.getById.bind(postsController));

router.post('/', postsController.post.bind(postsController));

router.put('/:id', postsController.put.bind(postsController));

router.delete('/:id', postsController.delete.bind(postsController));

export default router;
