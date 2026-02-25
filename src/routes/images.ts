import express from 'express';
import imagesController from '../controllers/images';
import { upload } from '../utils/multer';
import authMiddleware from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Images
 *   description: Image upload and management API
 */

/**
 * @swagger
 * /api/image/{id}:
 *   get:
 *     summary: Get image by ID
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image file
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Image not found
 */
router.get('/:id', imagesController.serveImage);

router.use(authMiddleware);

/**
 * @swagger
 * /api/image:
 *   post:
 *     summary: Upload a new image
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload (JPEG, PNG, max 5MB)
 *     responses:
 *       201:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Image'
 *       400:
 *         description: No file uploaded or invalid file type
 *       401:
 *         description: Unauthorized
 */
router.post('/', upload.single('image'), imagesController.uploadImage);

/**
 * @swagger
 * /api/image/{id}:
 *   delete:
 *     summary: Delete an image
 *     tags: [Images]
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
 *         description: Image deleted successfully
 *       404:
 *         description: Image not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', imagesController.deleteImage);

export default router;
