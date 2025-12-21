import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
    body: string;
    postId: mongoose.Types.ObjectId;
    author: string;

    createdAt?: Date;
    updatedAt?: Date;
}

const CommentSchema: Schema = new Schema({
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

