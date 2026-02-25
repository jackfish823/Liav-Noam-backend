import express from 'express';
import postsController from '../controllers/posts';
import authMiddleware from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Posts management API
 */

/**
 * @swagger
 * /api/post:
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
router.use(authMiddleware);

router.get('/', postsController.getPosts);

/**
 * @swagger
 * /api/post/search:
 *   get:
 *     summary: Search posts using free text and natural language filters
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Natural language search query (e.g., "posts about cats with more than 5 likes")
 *     responses:
 *       200:
 *         description: List of search results
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 */
router.get('/search', postsController.searchPosts);

/**
 * @swagger
 * /api/post/{id}:
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

/**
 * @swagger
 * /api/post:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *               image:
 *                 type: string
 *                 description: Optional image ID (reference to existing image)
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
router.post('/', postsController.createPost);

/**
 * @swagger
 * /api/post/{id}:
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               image:
 *                 type: string
 *                 nullable: true
 *                 description: Image ID (or null to remove image)
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
router.put('/:id', postsController.updatePost);

/**
 * @swagger
 * /api/post/{id}:
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

/**
 * @swagger
 * /api/post/{id}/like:
 *   post:
 *     summary: Like a post
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
 *       201:
 *         description: Post liked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 *       409:
 *         description: Post already liked
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/like', postsController.likePost);

/**
 * @swagger
 * /api/post/{id}/like:
 *   delete:
 *     summary: Remove like from a post
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
 *         description: Like removed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Like not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id/like', postsController.unlikePost);

export default router;
