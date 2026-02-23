import {Request, Response} from 'express';
import mongoose from 'mongoose';
import Comment from '../models/Comment';
import CommentVote from '../models/CommentVote';
import { AuthRequest } from '../middleware/auth';
import { abortTransactionSafely, commitTransactionSafely, startTransactionSafely } from '../utils/transaction';

type CommentQuery = Record<string, any>;

const getComments = async (req: AuthRequest, res: Response) => {
    const query: CommentQuery = {};

    const postId = req.query.postId ?? '';
    const author = req.query.author ?? '';
    const cursor = req.query.cursor as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (postId) {
        query.postId = postId;
    }

    if (author) {
        query.author = author;
    }

    if (cursor) {
        query._id = { $lt: cursor };
    }

    try {
        const comments = await Comment.find(query)
            .populate('author')
            .sort({ _id: -1 })
            .limit(limit + 1);

        const hasMore = comments.length > limit;
        const results = hasMore ? comments.slice(0, limit) : comments;
        const nextCursor = hasMore ? results[results.length - 1]._id.toString() : null;

        const voteByCommentId = new Map<string, number>();

        if (req.user?._id && results.length > 0) {
            const commentIds = results.map((c) => c._id);
            const votes = await CommentVote.find({ userId: req.user._id, commentId: { $in: commentIds } }).select('commentId value');

            votes.forEach((v) => voteByCommentId.set(v.commentId.toString(), v.value));
        }

        const commentsWithUserVote = results.map((c) => {
            const obj = c.toObject ? c.toObject() : { ...c };

            (obj as Record<string, unknown>).userVote = voteByCommentId.get(c._id.toString()) ?? null;

            return obj;
        });

        res.status(200).json({
            comments: commentsWithUserVote,
            pagination: {
                nextCursor,
                hasMore,
                limit
            }
        });
    } catch (error) {
        console.error({
            message: 'Failed getting posts comments',
            error,
            additionalData: {postId, author, cursor, limit}
        });

        res.status(500).json({message: 'Failed getting posts comments'});
    }
};

const getCommentById = async (req: AuthRequest, res: Response) => {
    const {id} = req.params;

    try {
        const comment = await Comment.findById(id).populate('author');

        if (!comment) {
            res.status(404).json({message: 'Comment not found'});
            return;
        }

        let userVote: number | null = null;

        if (req.user?._id) {
            const vote = await CommentVote.findOne({ userId: req.user._id, commentId: id }).select('value');
            userVote = vote?.value ?? null;
        }

        const obj = comment.toObject ? comment.toObject() : { ...comment };
        (obj as Record<string, unknown>).userVote = userVote;

        res.status(200).json(obj);
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

const voteComment = async (req: AuthRequest, res: Response) => {
    const commentId = req.params.id;
    const userId = req.user._id;
    const value = Number(req.body.value);

    if (value !== 1 && value !== -1) {
        res.status(400).json({message: 'value must be 1 or -1'});
        return;
    }

    const session = await mongoose.startSession();

    startTransactionSafely(session);

    try {
        const comment = await Comment.findById(commentId).session(session);

        if (!comment) {
            await abortTransactionSafely(session);
            res.status(404).json({message: 'Comment not found'});
            return;
        }

        const existing = await CommentVote.findOne({ commentId, userId }).session(session);
        const oldValue = existing?.value ?? 0;

        await CommentVote.findOneAndUpdate(
            { commentId, userId },
            { $set: { value } },
            { upsert: true, new: true, session }
        );

        const upDelta = (value === 1 ? 1 : 0) - (oldValue === 1 ? 1 : 0);
        const downDelta = (value === -1 ? 1 : 0) - (oldValue === -1 ? 1 : 0);

        await Comment.findByIdAndUpdate(
            commentId,
            { $inc: { upCount: upDelta, downCount: downDelta } },
            { session }
        );

        await commitTransactionSafely(session);

        const updatedComment = await Comment.findById(commentId).populate('author');
        res.status(200).json(updatedComment);
    } catch (error: any) {
        await abortTransactionSafely(session);
        console.error({
            message: 'Failed to vote on comment',
            error,
            additionalData: { commentId, userId, value }
        });
        res.status(500).json({message: 'Failed to vote on comment'});
    } finally {
        session.endSession();
    }
};

const removeCommentVote = async (req: AuthRequest, res: Response) => {
    const commentId = req.params.id;
    const userId = req.user._id;

    const session = await mongoose.startSession();
    startTransactionSafely(session);

    try {
        const existing = await CommentVote.findOneAndDelete({ commentId, userId }).session(session);

        if (!existing) {
            await abortTransactionSafely(session);
            res.status(404).json({message: 'Vote not found'});
            return;
        }

        const update = existing.value === 1
            ? { $inc: { upCount: -1 } }
            : { $inc: { downCount: -1 } };

        await Comment.findByIdAndUpdate(commentId, update, { session });

        await commitTransactionSafely(session);

        const updatedComment = await Comment.findById(commentId).populate('author');
        res.status(200).json(updatedComment);
    } catch (error: any) {
        await abortTransactionSafely(session);
        console.error({
            message: 'Failed to remove comment vote',
            error,
            additionalData: { commentId, userId }
        });
        res.status(500).json({message: 'Failed to remove comment vote'});
    } finally {
        session.endSession();
    }
};

export default {
    getComments,
    getCommentById,
    createComment,
    updateComment,
    deleteComment,
    voteComment,
    removeCommentVote
};
