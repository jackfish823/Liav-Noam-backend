import mongoose, { Schema } from 'mongoose';

export interface IPost {
    message: string;
    sender: string;

    createdAt?: Date;
    updatedAt?: Date;
}

const postSchema = new Schema<IPost>({
    message: {
        type: String,
        required: true,
    },
    sender: {
        type: String,
        required: true,
    },
}, { timestamps: true });

const Post = mongoose.model<IPost>('Post', postSchema);

export { Post }
