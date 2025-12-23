import { createController } from "./base.js";
import { Comment, IComment } from '../models/Comment.js';
import express from 'express';

const commentsController = createController<IComment>(Comment);

const router = express.Router();

router.get('/', commentsController.getAll.bind(commentsController));

router.get('/:id', commentsController.getById.bind(commentsController));

router.post('/', commentsController.post.bind(commentsController));

router.put('/:id', commentsController.put.bind(commentsController));

router.delete('/:id', commentsController.delete.bind(commentsController));

export default router;
