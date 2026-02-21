import express from 'express';
import commentsController from '../controllers/comments';
import authMiddleware from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Comments management API
 */

/**
 * @swagger
 * /comment:
 *   get:
 *     summary: Get all comments with cursor-based pagination
 *     tags: [Comments]
 *     parameters:
 *       - in: query
 *         name: postId
 *         schema:
 *           type: string
 *         description: Filter comments by post ID
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *         description: Filter comments by author ID
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor for pagination (comment ID to start after)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of comments to return
 *     responses:
 *       200:
 *         description: Paginated list of comments with cursor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Comment'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     nextCursor:
 *                       type: string
 *                       nullable: true
 *                       description: Cursor for the next page (null if no more results)
 *                     hasMore:
 *                       type: boolean
 *                       description: Whether there are more results available
 *                     limit:
 *                       type: integer
 *                       description: Number of items per page
 */
router.use(authMiddleware);

router.get('/', commentsController.getComments);

/**
 * @swagger
 * /comment/{id}:
 *   get:
 *     summary: Get a comment by ID
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       404:
 *         description: Comment not found
 */
router.get('/:id', commentsController.getCommentById);

/**
 * @swagger
 * /comment:
 *   post:
 *     summary: Create a new comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               body:
 *                 type: string
 *               postId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Missing comment body or postId
 *       401:
 *         description: Unauthorized
 */
router.post('/', commentsController.createComment);

/**
 * @swagger
 * /comment/{id}:
 *   put:
 *     summary: Update a comment
 *     tags: [Comments]
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
 *               body:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comment updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Missing comment body
 *       404:
 *         description: Comment not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', commentsController.updateComment);

/**
 * @swagger
 * /comment/{id}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
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
 *         description: Comment deleted
 *       404:
 *         description: Comment not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', commentsController.deleteComment);

/**
 * @swagger
 * /comment/{id}/vote:
 *   post:
 *     summary: Upvote or downvote a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *             properties:
 *               value:
 *                 type: integer
 *                 enum: [1, -1]
 *                 description: 1 for upvote, -1 for downvote
 *     responses:
 *       200:
 *         description: Vote recorded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: value must be 1 or -1
 *       404:
 *         description: Comment not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/vote', commentsController.voteComment);

/**
 * @swagger
 * /comment/{id}/vote:
 *   delete:
 *     summary: Remove vote from a comment
 *     tags: [Comments]
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
 *         description: Vote removed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       404:
 *         description: Vote not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id/vote', commentsController.removeCommentVote);

export default router;
