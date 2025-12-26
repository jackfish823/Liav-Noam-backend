import mongoose, {Document, Schema} from 'mongoose';

export interface IPost extends Document {
    message: string;
    author: mongoose.Types.ObjectId;
    comments?: any[];
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
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

postSchema.virtual('comments', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'postId'
});

const Post = mongoose.model<IPost>('Post', postSchema);

export { Post };
