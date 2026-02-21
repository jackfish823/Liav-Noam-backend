import express from 'express';
import postsController from '../controllers/posts';
import authMiddleware from '../middleware/auth';
import { upload } from '../utils/multer';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Posts management API
 */

/**
 * @swagger
 * /post:
 *   get:
 *     summary: Get all posts with cursor-based pagination
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *         description: Filter posts by author ID
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor for pagination (ID of the last post from previous page)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of posts to return per page
 *     responses:
 *       200:
 *         description: Paginated list of posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     nextCursor:
 *                       type: string
 *                       nullable: true
 *                       description: Cursor for the next page (null if no more pages)
 *                     hasMore:
 *                       type: boolean
 *                       description: Whether there are more pages available
 *                     limit:
 *                       type: integer
 *                       description: Number of items per page
 */
router.get('/', postsController.getPosts);

/**
 * @swagger
 * /post/{id}:
 *   get:
 *     summary: Get a post by ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 */
router.get('/:id', postsController.getPostById);

router.use(authMiddleware);

/**
 * @swagger
 * /post:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *               image:
 *                 oneOf:
 *                   - type: string
 *                     description: Image ID (reference to existing image)
 *                   - type: string
 *                     format: binary
 *                     description: Image file to upload (JPEG/PNG, max 5MB)
 *     responses:
 *       201:
 *         description: Post created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 */
router.post('/', upload.single('image'), postsController.createPost);

/**
 * @swagger
 * /post/{id}:
 *   put:
 *     summary: Update a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               image:
 *                 oneOf:
 *                   - type: string
 *                     description: Image ID (reference to existing image)
 *                   - type: string
 *                     format: binary
 *                     description: Image file to upload (JPEG/PNG, max 5MB)
 *     responses:
 *       200:
 *         description: Post updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', upload.single('image'), postsController.updatePost);

/**
 * @swagger
 * /post/{id}:
 *   delete:
 *     summary: Delete a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post deleted
 *       404:
 *         description: Post not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', postsController.deletePost);

export default router;
