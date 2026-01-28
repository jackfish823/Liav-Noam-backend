import mongoose, {Document, Schema } from 'mongoose';

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
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

postSchema.virtual('commentsCount', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'postId',
    count: true
});

postSchema.pre('find', function() {
    this.populate('author');
    this.populate('commentsCount');
});

postSchema.pre('findOne', function() {
    this.populate('author');
    this.populate('commentsCount');
});

postSchema.pre('findOneAndUpdate', function() {
    this.populate('author');
    this.populate('commentsCount');
});

export default mongoose.model<IPost>('Post', postSchema);
