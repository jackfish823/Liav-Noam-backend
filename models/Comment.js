import mongoose from 'mongoose';

const Schema = mongoose.Schema;
const CommentSchema = new Schema({
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
}, {timestamps: true});

const Comment = mongoose.model('Comment', CommentSchema);

export default Comment;
