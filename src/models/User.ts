import mongoose, {Document, Schema} from 'mongoose';

export interface IUser extends Document {
    username: string;
    email: string;

    createdAt?: Date;
    updatedAt?: Date;
}

const userSchema = new Schema<IUser>({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
}, {timestamps: true});

export default mongoose.model<IUser>('User', userSchema);
