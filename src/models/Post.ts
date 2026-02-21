import mongoose, {Document, Schema } from 'mongoose';

export interface IPost extends Document {
    message: string;
    author: mongoose.Types.ObjectId;
    image?: mongoose.Types.ObjectId;
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
    image: {
        type: Schema.Types.ObjectId,
        ref: 'Image',
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

postSchema.index({ author: 1, _id: -1 });

postSchema.pre('find', function() {
    this.populate('author');
    this.populate('commentsCount');
    this.populate('image', 'originalName mimetype size');
});

postSchema.pre('findOne', function() {
    this.populate('author');
    this.populate('commentsCount');
    this.populate('image', 'originalName mimetype size');
});

postSchema.pre('findOneAndUpdate', function() {
    this.populate('author');
    this.populate('commentsCount');
    this.populate('image', 'originalName mimetype size');
});

export default mongoose.model<IPost>('Post', postSchema);
