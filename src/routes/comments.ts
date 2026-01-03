import express from 'express';
import commentsController from '../controllers/comments';

const router = express.Router();

router.get('/', commentsController.getComments);
router.get('/:id', commentsController.getCommentById);
router.post('/', commentsController.createComment);
router.put('/:id', commentsController.updateComment);
router.delete('/:id', commentsController.deleteComment);

export default router;
