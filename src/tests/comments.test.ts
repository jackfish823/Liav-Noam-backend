import request from 'supertest';
import initApp from '../index';
import mongoose from 'mongoose';
import {Express} from 'express';
import Post from '../models/Post';
import Comment from '../models/Comment';
import User from '../models/User';

let app: Express;
let postId: string;
let accessToken: string;
const testUser = {
    username: 'commenttest',
    email: 'comment@test.com',
    password: 'password123'
};

beforeAll(async () => {
    app = await initApp();
    await Comment.deleteMany();
    await Post.deleteMany();
    await User.deleteMany();

    // Register and login user
    const userRes = await request(app).post('/user').send(testUser);
    const userId = userRes.body._id;

    const loginRes = await request(app).post('/auth/login').send({
        email: testUser.email,
        password: testUser.password
    });
    accessToken = loginRes.body.token;

    const post = await Post.create({
        message: 'Test Post',
        author: userId
    });
    postId = post._id.toString();
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('Comments API', () => {
    describe('POST /comment', () => {
        test('should create a new comment', async () => {
            const response = await request(app)
                .post('/comment')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    body: 'Test Comment',
                    postId: postId
                });
            expect(response.status).toBe(201);
            expect(response.body.body).toBe('Test Comment');
            expect(response.body.postId).toBe(postId);
        });

        test('should fail with 400 if postId is missing', async () => {
            const response = await request(app)
                .post('/comment')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    body: 'Test Comment'
                });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Comment body and postId are required');
        });

        test('should fail with 400 if body is missing', async () => {
            const response = await request(app)
                .post('/comment')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    postId: postId
                });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Comment body and postId are required');
        });
    });

    describe('GET /comment', () => {
        test('should get all comments', async () => {
            const response = await request(app).get('/comment');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBeTruthy();
            expect(response.body.length).toBeGreaterThan(0);
        });

        test('should filter comments by postId', async () => {
            const response = await request(app).get(`/comment?postId=${postId}`);
            expect(response.status).toBe(200);
            expect(response.body[0].postId).toBe(postId);
        });
    });

    describe('GET /comment/:id', () => {
        let commentId: string;

        beforeAll(async () => {
            const comment = await Comment.findOne();
            commentId = comment?._id.toString() || '';
        });

        test('should get comment by id', async () => {
            const response = await request(app).get(`/comment/${commentId}`);
            expect(response.status).toBe(200);
            expect(response.body._id).toBe(commentId);
        });

        test('should return 404 for non-existent comment', async () => {
            const response = await request(app).get('/comment/65e1d510e1b6f1234567890a');
            expect(response.status).toBe(404);
        });
    });

    describe('PUT /comment/:id', () => {
        let commentId: string;

        beforeAll(async () => {
            const comment = await Comment.findOne();
            commentId = comment?._id.toString() || '';
        });

        test('should update comment', async () => {
            const response = await request(app)
                .put(`/comment/${commentId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    body: 'Updated Comment'
                });
            expect(response.status).toBe(200);
            expect(response.body.body).toBe('Updated Comment');
        });

        test('should fail with 400 if body is missing', async () => {
            const response = await request(app)
                .put(`/comment/${commentId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({});
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Comment body is required');
        });

        test('should return 404 for non-existent comment', async () => {
            const response = await request(app)
                .put('/comment/65e1d510e1b6f1234567890a')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    body: 'Updated Comment'
                });
            expect(response.status).toBe(404);
        });
    });

    describe('DELETE /comment/:id', () => {
        let commentId: string;

        beforeEach(async () => {
            const comment = await Comment.create({
                body: 'Delete Me',
                postId: postId,
                author: (await User.findOne())?._id
            });
            commentId = comment._id.toString();
        });

        test('should delete comment', async () => {
            const response = await request(app)
                .delete(`/comment/${commentId}`)
                .set('Authorization', `Bearer ${accessToken}`);
            expect(response.status).toBe(200);
            expect(response.body._id).toBe(commentId);
        });

        test('should return 404 for non-existent comment', async () => {
            const response = await request(app)
                .delete('/comment/65e1d510e1b6f1234567890a')
                .set('Authorization', `Bearer ${accessToken}`);
            expect(response.status).toBe(404);
        });
    });
});
