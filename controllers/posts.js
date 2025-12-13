import express from 'express';
import Post from '../models/Post.js';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const {message, sender} = req.body;
        const newPost = new Post({message, sender});
        const savedPost = await newPost.save();
        res.status(201).json(savedPost);
    } catch (error) {
        res.status(409).json({message: error.message});
    }
});

export default router;
