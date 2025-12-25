import mongoose, { Schema, Document } from 'mongoose';

export interface IPost extends Document {
    message: string;
    author: mongoose.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

const postSchema = new Schema<IPost>({
    message: {
        type: String,
        required: true,
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true });

const Post = mongoose.model<IPost>('Post', postSchema);

export { Post };
