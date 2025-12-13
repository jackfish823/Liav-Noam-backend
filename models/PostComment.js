import mongoose from 'mongoose';

const Schema = mongoose.Schema;
const postCommentSchema = new Schema({
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

const PostComment = mongoose.model('PostComment', postCommentSchema);

export default PostComment;
