import express from 'express';
import commentsController from '../controllers/comments';
import authMiddleware from '../middleware/auth';

const router = express.Router();

router.get('/', commentsController.getComments);
router.get('/:id', commentsController.getCommentById);

router.use(authMiddleware);

router.post('/', commentsController.createComment);
router.put('/:id', commentsController.updateComment);
router.delete('/:id', commentsController.deleteComment);

export default router;
