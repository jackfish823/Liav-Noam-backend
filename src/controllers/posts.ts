import {Request, Response} from 'express';
import Post from '../models/Post';
import { AuthRequest } from '../middleware/auth';

type PostQuery = Record<string, any>;

const getPosts= async (req: Request, res: Response) => {
    const query: PostQuery = {};

    const author = req.query.author as string;
    const cursor = req.query.cursor as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (author) {
        query.author = author;
    }

    if (cursor) {
        query._id = { $lt: cursor };
    }

    try {
        const posts = await Post.find(query)
            .sort({ _id: -1 })
            .limit(limit + 1);

        const hasMore = posts.length > limit;
        const results = hasMore ? posts.slice(0, limit) : posts;
        const nextCursor = hasMore ? results[results.length - 1]._id.toString() : null;

        res.status(200).json({
            posts: results,
            pagination: {
                nextCursor,
                hasMore,
                limit
            }
        });
    } catch (error: any) {
        console.error({
            message: 'Failed getting posts',
            error,
            additionalData: {author, cursor, limit}
        });

        res.status(500).json({message: 'Failed getting posts'});
    }
};

const createPost = async (req: AuthRequest, res: Response) => {
    const {message, image} = req.body;
    const author = req.user._id;

    if (!message) {
        res.status(400).json({message: "Message is required"});
        return;
    }

    try {
        const postData: any = {
            message,
            author
        };

        if (image) {
            postData.image = image;
        }

        const savedPost = await Post.create(postData);
        const postWithPopulatedData = await Post.findById(savedPost._id);

        res.status(201).json(postWithPopulatedData);
    } catch (error: any) {
        res.status(409).json({message: error.message});
    }
};

const getPostById = async (req: Request, res: Response) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            res.status(404).json({message: 'Post not found'});
            return;
        }

        res.status(200).json(post);
    } catch (error: any) {
        res.status(500).json({message: error.message});
    }
};

const updatePost = async (req: AuthRequest, res: Response) => {
    const {id} = req.params;
    const {message, image} = req.body;

    try {
        const updateData: any = {};

        if (message) updateData.message = message;

        if ('image' in req.body) {
            updateData.image = image || null;
        }

        const updatedPost = await Post.findByIdAndUpdate(
            id,
            updateData,
            {new: true}
        );

        if (!updatedPost) {
            res.status(404).json({message: 'Post not found'});
            return;
        }

        res.status(200).json(updatedPost);
    } catch (error: any) {
        res.status(500).json({message: error.message});
    }
};

const deletePost = async (req: Request, res: Response) => {
    try {
        const {id} = req.params;
        const deletedPost = await Post.findByIdAndDelete(id);

        if (!deletedPost) {
            res.status(404).json({message: 'Post not found'});
            return;
        }

        res.status(200).json(deletedPost);
    } catch (error: any) {
        res.status(500).json({message: error.message});
    }
};

export default {
    getPosts,
    createPost,
    getPostById,
    updatePost,
    deletePost
};
