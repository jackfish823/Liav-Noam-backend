import mongoose, {Document, Schema} from 'mongoose';

export interface IImage extends Document {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    path: string;
    uploadedBy: mongoose.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

const imageSchema = new Schema<IImage>({
    filename: {
        type: String,
        required: true,
        unique: true,
    },
    originalName: {
        type: String,
        required: true,
    },
    mimetype: {
        type: String,
        required: true,
    },
    size: {
        type: Number,
        required: true,
    },
    path: {
        type: String,
        required: true,
    },
    uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

imageSchema.virtual('url').get(function() {
    const baseUrl = process.env.BASE_URL || '/api';

    return `${baseUrl}/image/${this._id}`;
});

export default mongoose.model<IImage>('Image', imageSchema);
