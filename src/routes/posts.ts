import express from 'express';
import postsController from '../controllers/posts';

const router = express.Router();

router.get('/', postsController.getPosts);
router.post('/', postsController.createPost);
router.get('/:id', postsController.getPostById);
router.put('/:id', postsController.updatePost);
router.delete('/:id', postsController.deletePost);

export default router;
