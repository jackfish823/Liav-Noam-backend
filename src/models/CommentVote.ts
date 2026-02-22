import mongoose, {Document, Schema} from 'mongoose';

export interface ICommentVote extends Document {
    commentId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    value: number;
    createdAt?: Date;
}

const commentVoteSchema = new Schema<ICommentVote>({
    commentId: {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
        required: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    value: {
        type: Number,
        required: true,
        enum: [1, -1],
    },
}, { timestamps: true });

commentVoteSchema.index({ commentId: 1, userId: 1 }, { unique: true });

export default mongoose.model<ICommentVote>('CommentVote', commentVoteSchema);
