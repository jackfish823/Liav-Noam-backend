import express, {Request, Response} from 'express';
import Comment from '../models/Comment';

type CommentQuery = Record<string, any>;

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
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
});

router.get('/:id', async (req: Request, res: Response) => {
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
});

router.post('/', async (req: Request, res: Response) => {
    const {body, postId, author} = req.body;

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
});

router.put('/:id', async (req: Request, res: Response) => {
    const {id} = req.params;
    const {body} = req.body;

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
});

router.delete('/:id', async (req: Request, res: Response) => {
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
});

export default router;
