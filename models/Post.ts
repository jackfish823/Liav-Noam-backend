import mongoose, {Schema, Document} from 'mongoose';

export interface IPost extends Document {
    message: string;
    sender: string;

    createdAt?: Date;
    updatedAt?: Date;
}

const postSchema: Schema = new Schema({
    message: {
        type: String,
        required: true,
    },
    sender: {
        type: String,
        required: true,
    },
}, {timestamps: true});

const Post = mongoose.model<IPost>('Post', postSchema);

export {Post}
