import express from 'express';
import PostComments from '../models/Comment.js';

const router = express.Router();

router.get('/', async (req, res) => {
    const query = {}

    const {postId, author} = req.query;

    if (postId) {
        query['postId'] = postId;
    }

    if (author) {
        query['author'] = author;
    }

    try {
        const comments = await PostComments.find(query);

        res.status(200).json(comments);
    } catch (error) {
        console.error({
            message: 'Filed getting posts comments',
            error,
            additionalData: { postId, author }
        });

        res.status(500).json({message: 'Failed getting posts comments'});
    }
});

router.post('/', async (req, res) => {
    const { body, postId, author } = req.body;

    try {
        const comment = await PostComments.create({ body, postId, author });

        res.status(201).json(comment);
    } catch (error) {
        console.error({
            message: 'Failed to create comment',
            error,
            additionalData: { body, postId, author }
        });

        res.status(500).json({ message: 'Failed to create comment' });
    }
});

export default router;
