import {Request, Response} from 'express';
import mongoose from 'mongoose';
import Post from '../models/Post';
import Like from '../models/Like';
import { AuthRequest } from '../middleware/auth';
import { MONGO_ERROR_CODES } from '../constants/mongo';

type PostQuery = Record<string, any>;

const getPosts = async (req: AuthRequest, res: Response) => {
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

        let likedPostIds = new Set<string>();

        if (req.user?._id && results.length > 0) {
            const postIds = results.map((p) => p._id);
            const likes = await Like.find({ userId: req.user._id, postId: { $in: postIds } }).select('postId');

            likedPostIds = new Set(likes.map((l) => l.postId.toString()));
        }

        const postsWithLiked = results.map((p) => {
            const obj = p.toObject ? p.toObject() : { ...p };
            (obj as Record<string, unknown>).isLiked = likedPostIds.has(p._id.toString());

            return obj;
        });

        res.status(200).json({
            posts: postsWithLiked,
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

const getPostById = async (req: AuthRequest, res: Response) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            res.status(404).json({message: 'Post not found'});
            return;
        }

        let isLiked = false;

        if (req.user?._id) {
            const like = await Like.findOne({ userId: req.user._id, postId: req.params.id }).select('_id');
            isLiked = !!like;
        }

        const obj = post.toObject ? post.toObject() : { ...post };
        (obj as Record<string, unknown>).isLiked = isLiked;

        res.status(200).json(obj);
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

const likePost = async (req: AuthRequest, res: Response) => {
    const postId = req.params.id;
    const userId = req.user._id;

    const session = await mongoose.startSession();

    session.startTransaction();

    try {
        const post = await Post.findById(postId).session(session);

        if (!post) {
            await session.abortTransaction();

            res.status(404).json({message: 'Post not found'});

            return;
        }

        await Like.create([{ postId, userId }], { session });
        await Post.findByIdAndUpdate(postId, { $inc: { likeCount: 1 } }, { session });

        await session.commitTransaction();

        const updatedPost = await Post.findById(postId);

        res.status(201).json(updatedPost);
    } catch (error: any) {
        await session.abortTransaction();

        if (error.code === MONGO_ERROR_CODES.DUPLICATE_KEY) {
            res.status(409).json({message: 'Post already liked'});
            return;
        }

        console.error({ message: 'Failed to like post', error, additionalData: { postId, userId } });

        res.status(500).json({message: 'Failed to like post'});
    } finally {
        session.endSession();
    }
};

const unlikePost = async (req: AuthRequest, res: Response) => {
    const postId = req.params.id;
    const userId = req.user._id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const deleteResult = await Like.deleteOne({ postId, userId }).session(session);

        if (deleteResult.deletedCount === 0) {
            await session.abortTransaction();

            res.status(404).json({message: 'Like not found'});

            return;
        }

        await Post.findByIdAndUpdate(postId, { $inc: { likeCount: -1 } }, { session });

        await session.commitTransaction();

        const updatedPost = await Post.findById(postId);

        res.status(200).json(updatedPost);
    } catch (error: any) {
        await session.abortTransaction();

        console.error({ message: 'Failed to unlike post', error, additionalData: { postId, userId } });

        res.status(500).json({message: 'Failed to unlike post'});
    } finally {
        session.endSession();
    }
};

export default {
    getPosts,
    createPost,
    getPostById,
    updatePost,
    deletePost,
    likePost,
    unlikePost
};
