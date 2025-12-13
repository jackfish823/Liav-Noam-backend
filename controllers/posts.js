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

router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({message: 'Post not found'});
        }

        res.status(200).json(post);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

export default router;
