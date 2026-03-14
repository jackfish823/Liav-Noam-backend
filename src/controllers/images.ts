import {Response} from 'express';
import {AuthRequest} from '../middleware/auth';
import Image from '../models/Image';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = 'uploads';

export const uploadImage = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).send({ error: 'No file uploaded' });
        }

        const imageData = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
            uploadedBy: req.user._id,
        };

        const image = new Image(imageData);
        await image.save();

        const baseUrl = process.env.BASE_URL || '/api';

        const response = {
            id: image._id,
            originalName: image.originalName,
            mimetype: image.mimetype,
            size: image.size,
            url: `${baseUrl}/image/${image._id}`,
        };

        res.status(201).send(response);
    } catch (error) {
        console.error('Error uploading image:', error);
        
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error deleting file:', err);
            });
        }
        
        res.status(500).send({ error: 'Error uploading image' });
    }
};


export const serveImage = async (req: AuthRequest, res: Response) => {
    try {
        const image = await Image.findById(req.params.id);
        
        if (!image) {
            return res.status(404).send({ error: 'Image not found' });
        }

        const filePath = path.resolve(image.path);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).send({ error: 'Image file not found on server' });
        }

        res.setHeader('Content-Type', image.mimetype);
        res.setHeader('Content-Disposition', `inline; filename="${image.originalName}"`);
        res.setHeader('X-Filename', image.originalName);
        
        res.sendFile(filePath);
    } catch (error) {
        console.error('Error serving image:', error);
        res.status(500).send({ error: 'Error serving image' });
    }
};

export const deleteImage = async (req: AuthRequest, res: Response) => {
    try {
        const image = await Image.findById(req.params.id);
        
        if (!image) {
            return res.status(404).send({ error: 'Image not found' });
        }

        const filePath = path.resolve(image.path);

        await Image.findByIdAndDelete(req.params.id);
        
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (fileError) {
                console.error('Failed to delete file from disk:', fileError);
            }
        }
        
        res.status(200).send({ message: 'Image deleted successfully' });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).send({ error: 'Error deleting image' });
    }
};

export default {
    uploadImage,
    serveImage,
    deleteImage,
};
