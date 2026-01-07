import {Request, Response} from 'express';
import Comment from '../models/Comment';
import { AuthRequest } from '../middleware/auth';

type CommentQuery = Record<string, any>;

const getComments = async (req: Request, res: Response) => {
    const query: CommentQuery = {};

    const postId = req.query.postId ?? '';
    const author = req.query.author ?? '';

    if (postId) {
        query.postId = postId;
    }

    if (author) {
        query.author = author;
    }

    try {
        const comments = await Comment.find(query).populate('author');

        res.status(200).json(comments);
    } catch (error) {
        console.error({
            message: 'Filed getting posts comments',
            error,
            additionalData: {postId, author}
        });

        res.status(500).json({message: 'Failed getting posts comments'});
    }
};

const getCommentById =  async (req: Request, res: Response) => {
    const {id} = req.params;

    try {
        const comment = await Comment.findById(id).populate('author');

        if (!comment) {
            res.status(404).json({message: 'Comment not found'});
            return;
        }

        res.status(200).json(comment);
    } catch (error) {
        console.error({
            message: 'Failed to get comment',
            error,
            additionalData: {id}
        });

        res.status(500).json({message: 'Failed to get comment'});
    }
};

const createComment =  async (req: AuthRequest, res: Response) => {
    const {body, postId} = req.body;
    const author = req.user._id;

    if (!body || !postId) {
        res.status(400).json({message: 'Comment body and postId are required'});
        return;
    }

    try {
        const comment = await Comment.create({body, postId, author});

        res.status(201).json(comment);
    } catch (error) {
        console.error({
            message: 'Failed to create comment',
            error,
            additionalData: {body, postId, author}
        });

        res.status(500).json({message: 'Failed to create comment'});
    }
};

const updateComment = async (req: Request, res: Response) => {
    const {id} = req.params;
    const {body} = req.body;

    if (!body) {
        res.status(400).json({message: 'Comment body is required'});
        return;
    }

    try {
        const updatedComment = await Comment.findByIdAndUpdate(id, {body}, {new: true});

        if (!updatedComment) {
            res.status(404).json({message: 'Comment not found'});
            return;
        }

        res.status(200).json(updatedComment);
    } catch (error) {
        console.error({
            message: 'Failed to update comment',
            error,
            additionalData: {id, body}
        });

        res.status(500).json({message: 'Failed to update comment'});
    }
};

const deleteComment =  async (req: Request, res: Response) => {
    const {id} = req.params;

    try {
        const deletedComment = await Comment.findByIdAndDelete(id);

        if (!deletedComment) {
            res.status(404).json({message: 'Comment not found'});
            return;
        }

        res.status(200).json(deletedComment);
    } catch (error) {
        console.error({
            message: 'Failed to delete comment',
            error,
            additionalData: {id}
        });

        res.status(500).json({message: 'Failed to delete comment'});
    }
};

export default {
    getComments,
    getCommentById,
    createComment,
    updateComment,
    deleteComment
};
