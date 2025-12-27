import request from 'supertest';
import initApp from '../index';
import mongoose from 'mongoose';
import {Express} from 'express';
import User from '../models/User';
import Post from '../models/Post';

let app: Express;
let userId: string;
let postId: string;

beforeAll(async () => {
    app = await initApp();
    await User.deleteMany();
    await Post.deleteMany();

    const userResponse = await request(app).post('/user').send({
        username: 'testuser',
        email: 'test@test.com',
    });
    userId = userResponse.body._id;
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('Posts API', () => {
    test('GET /post should return empty array initially', async () => {
        const response = await request(app).get('/post');
        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    test('POST /post should create a new post', async () => {
        const response = await request(app).post('/post').send({
            message: 'Test Message',
            author: userId,
        });
        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Test Message');
        expect(response.body.author).toBe(userId);
        postId = response.body._id;
    });

    test('POST /post should fail with missing fields', async () => {
        const response = await request(app).post('/post').send({
            message: 'Test Message',
            // Missing author
        });
        expect(response.status).toBe(409);
    });

    test('GET /post should return all posts', async () => {
        const response = await request(app).get('/post');
        expect(response.status).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].message).toBe('Test Message');
        // Check population
        expect(response.body[0].author._id).toBe(userId);
    });

    test('GET /post/:id should return a post by id', async () => {
        const response = await request(app).get(`/post/${postId}`);
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Test Message');
        expect(response.body.author._id).toBe(userId);
    });

    test('GET /post/:id should return 404 for non-existent id', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(app).get(`/post/${fakeId}`);
        expect(response.status).toBe(404);
    });

    test('GET /post?author=ID should return posts by author', async () => {
        const response = await request(app).get(`/post?author=${userId}`);
        expect(response.status).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].author._id).toBe(userId);
    });

    test('PUT /post/:id should update a post', async () => {
        const response = await request(app).put(`/post/${postId}`).send({
            message: 'Updated Message',
            author: userId,
        });
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Updated Message');
    });

    test('PUT /post/:id should return 404 for non-existent id', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(app).put(`/post/${fakeId}`).send({
            message: 'Updated Message',
            author: userId,
        });
        expect(response.status).toBe(404);
    });

    test('DELETE /post/:id should delete a post', async () => {
        const response = await request(app).delete(`/post/${postId}`);
        expect(response.status).toBe(200);
    });

    test('DELETE /post/:id should return 404 for non-existent id', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(app).delete(`/post/${fakeId}`);
        expect(response.status).toBe(404);
    });

    test('GET /post/:id should return 404 after delete', async () => {
        const response = await request(app).get(`/post/${postId}`);
        expect(response.status).toBe(404);
    });
});
