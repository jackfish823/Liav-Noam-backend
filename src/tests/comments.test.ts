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
    const userRes = await request(app).post('/api/user').send(testUser);
    const userId = userRes.body._id;

    const loginRes = await request(app).post('/api/auth/login').send({
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
                .post('/api/comment')
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
                .post('/api/comment')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    body: 'Test Comment'
                });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Comment body and postId are required');
        });

        test('should fail with 400 if body is missing', async () => {
            const response = await request(app)
                .post('/api/comment')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    postId: postId
                });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Comment body and postId are required');
        });
    });

    describe('GET /comment', () => {
        test('should get all comments with cursor pagination', async () => {
            const response = await request(app).get('/api/comment')
                .set('Authorization', `Bearer ${accessToken}`);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('comments');
            expect(response.body).toHaveProperty('pagination');
            expect(Array.isArray(response.body.comments)).toBeTruthy();
            expect(response.body.comments.length).toBeGreaterThan(0);
            expect(response.body.pagination).toHaveProperty('nextCursor');
            expect(response.body.pagination).toHaveProperty('hasMore');
            expect(response.body.pagination).toHaveProperty('limit');
        });

        test('should filter comments by postId', async () => {
            const response = await request(app).get(`/api/comment?postId=${postId}`)
                .set('Authorization', `Bearer ${accessToken}`);
            expect(response.status).toBe(200);
            expect(response.body.comments[0].postId).toBe(postId);
        });

        test('should paginate comments with cursor', async () => {
            const firstResponse = await request(app).get('/api/comment?limit=1')
                .set('Authorization', `Bearer ${accessToken}`);
            expect(firstResponse.status).toBe(200);
            expect(firstResponse.body.comments.length).toBeLessThanOrEqual(1);
            expect(firstResponse.body.pagination.limit).toBe(1);

            if (firstResponse.body.pagination.hasMore) {
                const cursor = firstResponse.body.pagination.nextCursor;
                const secondResponse = await request(app).get(`/api/comment?cursor=${cursor}&limit=1`)
                    .set('Authorization', `Bearer ${accessToken}`);
                expect(secondResponse.status).toBe(200);
                expect(secondResponse.body.comments[0]._id).not.toBe(firstResponse.body.comments[0]._id);
            }
        });
    });

    describe('GET /comment/:id', () => {
        let commentId: string;

        beforeAll(async () => {
            const comment = await Comment.findOne();
            commentId = comment?._id.toString() || '';
        });

        test('should get comment by id', async () => {
            const response = await request(app).get(`/api/comment/${commentId}`)
                .set('Authorization', `Bearer ${accessToken}`);
            expect(response.status).toBe(200);
            expect(response.body._id).toBe(commentId);
        });

        test('should return 404 for non-existent comment', async () => {
            const response = await request(app).get('/api/comment/65e1d510e1b6f1234567890a')
                .set('Authorization', `Bearer ${accessToken}`);
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
                .put(`/api/comment/${commentId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    body: 'Updated Comment'
                });
            expect(response.status).toBe(200);
            expect(response.body.body).toBe('Updated Comment');
        });

        test('should fail with 400 if body is missing', async () => {
            const response = await request(app)
                .put(`/api/comment/${commentId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({});
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Comment body is required');
        });

        test('should return 404 for non-existent comment', async () => {
            const response = await request(app)
                .put('/api/comment/65e1d510e1b6f1234567890a')
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
                .delete(`/api/comment/${commentId}`)
                .set('Authorization', `Bearer ${accessToken}`);
            expect(response.status).toBe(200);
            expect(response.body._id).toBe(commentId);
        });

        test('should return 404 for non-existent comment', async () => {
            const response = await request(app)
                .delete('/api/comment/65e1d510e1b6f1234567890a')
                .set('Authorization', `Bearer ${accessToken}`);
            expect(response.status).toBe(404);
        });
    });
});
