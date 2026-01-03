import express from 'express';
import postsController from '../controllers/posts';
import authMiddleware from '../middleware/auth';

const router = express.Router();

router.get('/', postsController.getPosts);
router.get('/:id', postsController.getPostById);

router.use(authMiddleware);

router.post('/', postsController.createPost);
router.put('/:id', postsController.updatePost);
router.delete('/:id', postsController.deletePost);

export default router;
