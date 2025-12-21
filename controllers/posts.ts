import express, { Request, Response } from 'express';
import {Post} from '../models/Post.js';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
    try {
        const sender = req.query.sender as string;
        const filter = sender ? { sender } : {};
        const posts = await Post.find(filter);

        res.status(200).json(posts);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/', async (req: Request, res: Response) => {
    try {
        const { message, sender } = req.body;
        const newPost = new Post({ message, sender });
        const savedPost = await newPost.save();

        res.status(201).json(savedPost);
    } catch (error: any) {
        res.status(409).json({ message: error.message });
    }
});

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            res.status(404).json({ message: 'Post not found' });
            return;
        }

        res.status(200).json(post);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { message, sender } = req.body;
        const updatedPost = await Post.findByIdAndUpdate(
            id,
            { message, sender },
            { new: true }
        );

        if (!updatedPost) {
            res.status(404).json({ message: 'Post not found' });
            return;
        }

        res.status(200).json(updatedPost);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deletedPost = await Post.findByIdAndDelete(id);

        if (!deletedPost) {
            res.status(404).json({ message: 'Post not found' });
            return;
        }

        res.status(200).json(deletedPost);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
