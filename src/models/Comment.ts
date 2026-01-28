import mongoose, {Document, Schema} from 'mongoose';

export interface IComment extends Document {
    body: string;
    postId: mongoose.Types.ObjectId;
    author: mongoose.Types.ObjectId;
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
        required: true,
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
}, { timestamps: true });

CommentSchema.index({ postId: 1, _id: -1 });
CommentSchema.index({ author: 1, _id: -1 });

export default mongoose.model<IComment>('Comment', CommentSchema);

