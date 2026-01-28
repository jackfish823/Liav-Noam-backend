import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import crypto from 'crypto';

const UPLOAD_DIR = 'uploads';

const ALLOWED_MIMETYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const storage = multer.diskStorage({
    destination: (_req: Request, _file: Express.Multer.File, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (_req: Request, file: Express.Multer.File, cb) => {
        const uniqueId = crypto.randomUUID();
        const extension = path.extname(file.originalname);
        const filename = `${uniqueId}${extension}`;

        cb(null, filename);
    },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Unsupported file type. Only JPEG, PNG images are allowed.'));
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE },
});
