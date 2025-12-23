import mongoose, { Schema } from 'mongoose';

export interface IComment {
    body: string;
    postId: mongoose.Types.ObjectId;
    author: string;

    createdAt?: Date;
    updatedAt?: Date;
}

const CommentSchema = new Schema<IComment>({
    body: {
        type: String,
        required: true,
    },
    postId: {
        type: Schema.Types.ObjectId,
        ref: "Post",
    },
    author: {
        type: String,
        required: true,
    }
}, { timestamps: true });

const Comment = mongoose.model<IComment>('Comment', CommentSchema);

export { Comment }

