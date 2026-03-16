import request from 'supertest';
import initApp from '../index';
import mongoose from 'mongoose';
import {Express} from 'express';
import User from '../models/User';
import Image from '../models/Image';
import fs from 'fs';
import path from 'path';

let app: Express;
let accessToken: string;

const testUser = {
    username: 'imagetest',
    email: 'image@test.com',
    password: 'password123'
};

const testImagePath = path.join(__dirname, 'test-image.png');

beforeAll(async () => {
    app = await initApp();
    await Image.deleteMany();
    await User.deleteMany();

    // Create a small valid PNG file for testing
    // Minimal 1x1 white PNG
    const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        'base64'
    );
    fs.writeFileSync(testImagePath, pngBuffer);

    const userRes = await request(app).post('/api/user').send(testUser);

    const loginRes = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: testUser.password
    });
    accessToken = loginRes.body.token;
}, 30000);

afterAll(async () => {
    // Clean up test image file
    if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
    }
    await mongoose.connection.close();
});

describe('Images API', () => {
    let imageId: string;

    describe('POST /image', () => {
        test('should upload an image', async () => {
            const response = await request(app)
                .post('/api/image')
                .set('Authorization', `Bearer ${accessToken}`)
                .attach('image', testImagePath);
            expect(response.status).toBe(201);
            expect(response.body.id).toBeDefined();
            expect(response.body.originalName).toBe('test-image.png');
            expect(response.body.mimetype).toBe('image/png');
            expect(response.body.size).toBeGreaterThan(0);
            expect(response.body.url).toContain(`/image/${response.body.id}`);
            imageId = response.body.id;
        });

        test('should return 400 if no file is uploaded', async () => {
            const response = await request(app)
                .post('/api/image')
                .set('Authorization', `Bearer ${accessToken}`);
            expect(response.status).toBe(400);
        });

        test('should return 401 without auth token', async () => {
            const response = await request(app)
                .post('/api/image')
                .attach('image', testImagePath);
            expect(response.status).toBe(401);
        });
    });

    describe('GET /image/:id', () => {
        test('should serve an uploaded image', async () => {
            const response = await request(app)
                .get(`/api/image/${imageId}`);
            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toContain('image/png');
            expect(response.headers['x-filename']).toBe('test-image.png');
        });

        test('should return 404 for non-existent image', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .get(`/api/image/${fakeId}`);
            expect(response.status).toBe(404);
        });
    });

    describe('DELETE /image/:id', () => {
        test('should return 401 without auth token', async () => {
            const response = await request(app)
                .delete(`/api/image/${imageId}`);
            expect(response.status).toBe(401);
        });

        test('should delete an image', async () => {
            const response = await request(app)
                .delete(`/api/image/${imageId}`)
                .set('Authorization', `Bearer ${accessToken}`);
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Image deleted successfully');
        });

        test('should return 404 after deletion', async () => {
            const response = await request(app)
                .delete(`/api/image/${imageId}`)
                .set('Authorization', `Bearer ${accessToken}`);
            expect(response.status).toBe(404);
        });

        test('should return 404 for non-existent image', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .delete(`/api/image/${fakeId}`)
                .set('Authorization', `Bearer ${accessToken}`);
            expect(response.status).toBe(404);
        });
    });
});
