import request from 'supertest';
import initApp from '../index';
import mongoose from 'mongoose';
import {Express} from 'express';
import User from '../models/User';
import Post from '../models/Post';
import Like from '../models/Like';

let app: Express;
let userId: string;
let postId: string;
let accessToken: string;

const testUser = {
    username: 'testuser',
    email: 'test@test.com',
    password: 'test123'
};

beforeAll(async () => {
    app = await initApp();
    await User.deleteMany();
    await Post.deleteMany();
    await Like.deleteMany();

    // Register user
    const userResponse = await request(app).post('/api/user').send(testUser);

    userId = userResponse.body._id;

    // Login to get access token
    const loginResponse = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: testUser.password
    });
    accessToken = loginResponse.body.token;
}, 30000);

afterAll(async () => {
    await mongoose.connection.close();
});

describe('Posts API', () => {
    test('GET /post should return empty results with pagination initially', async () => {
        const response = await request(app).get('/api/post')
            .set('Authorization', 'Bearer ' + accessToken);
        expect(response.status).toBe(200);
        expect(response.body.posts).toEqual([]);
        expect(response.body.pagination.hasMore).toBe(false);
        expect(response.body.pagination.nextCursor).toBeNull();
    });

    test('POST /post should create a new post', async () => {
        const response = await request(app).post('/api/post')
            .set('Authorization', 'Bearer ' + accessToken)
            .send({ message: 'Test Message' });
        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Test Message');
        expect(response.body.author._id).toBe(userId);
        postId = response.body._id;
    });

    test('POST /post should fail with missing fields', async () => {
        const response = await request(app).post('/api/post')
            .set('Authorization', 'Bearer ' + accessToken)
            .send({});
        expect(response.status).toBe(400);
    });

    test('GET /post should return all posts with pagination', async () => {
        const response = await request(app).get('/api/post')
            .set('Authorization', 'Bearer ' + accessToken);
        expect(response.status).toBe(200);
        expect(response.body.posts.length).toBe(1);
        expect(response.body.posts[0].message).toBe('Test Message');
        expect(response.body.posts[0].author._id).toBe(userId);
        expect(response.body.pagination.hasMore).toBe(false);
        expect(response.body.pagination.nextCursor).toBeNull();
    });

    test('GET /post/:id should return a post by id', async () => {
        const response = await request(app).get(`/api/post/${postId}`)
            .set('Authorization', 'Bearer ' + accessToken);
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Test Message');
        expect(response.body.author._id).toBe(userId);
    });

    test('GET /post/:id should return 404 for non-existent id', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(app).get(`/api/post/${fakeId}`)
            .set('Authorization', 'Bearer ' + accessToken);
        expect(response.status).toBe(404);
    });

    test('GET /post?author=ID should return posts by author', async () => {
        const response = await request(app).get(`/api/post?author=${userId}`)
            .set('Authorization', 'Bearer ' + accessToken);
        expect(response.status).toBe(200);
        expect(response.body.posts.length).toBe(1);
        expect(response.body.posts[0].author._id).toBe(userId);
    });

    test('GET /post with cursor pagination should work correctly', async () => {
        await request(app).post('/api/post')
            .set('Authorization', 'Bearer ' + accessToken)
            .send({ message: 'Post 2' });
        await request(app).post('/api/post')
            .set('Authorization', 'Bearer ' + accessToken)
            .send({ message: 'Post 3' });

        const firstPage = await request(app).get('/api/post?limit=2')
            .set('Authorization', 'Bearer ' + accessToken);
        expect(firstPage.status).toBe(200);
        expect(firstPage.body.posts.length).toBe(2);
        expect(firstPage.body.pagination.hasMore).toBe(true);
        expect(firstPage.body.pagination.nextCursor).toBeDefined();

        const secondPage = await request(app).get(`/api/post?limit=2&cursor=${firstPage.body.pagination.nextCursor}`)
            .set('Authorization', 'Bearer ' + accessToken);
        expect(secondPage.status).toBe(200);
        expect(secondPage.body.posts.length).toBe(1);
        expect(secondPage.body.pagination.hasMore).toBe(false);
        expect(secondPage.body.pagination.nextCursor).toBeNull();
    });

    test('PUT /post/:id should update a post', async () => {
        const response = await request(app).put(`/api/post/${postId}`)
            .set('Authorization', 'Bearer ' + accessToken)
            .send({ message: 'Updated Message' });
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Updated Message');
    });

    test('PUT /post/:id should return 404 for non-existent id', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(app).put(`/api/post/${fakeId}`)
            .set('Authorization', 'Bearer ' + accessToken)
            .send({ message: 'Updated Message' });
        expect(response.status).toBe(404);
    });

    test('DELETE /post/:id should delete a post', async () => {
        const response = await request(app).delete(`/api/post/${postId}`)
            .set('Authorization', 'Bearer ' + accessToken);
        expect(response.status).toBe(200);
    });

    test('DELETE /post/:id should return 404 for non-existent id', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(app).delete(`/api/post/${fakeId}`)
            .set('Authorization', 'Bearer ' + accessToken);
        expect(response.status).toBe(404);
    });

    test('GET /post/:id should return 404 after delete', async () => {
        const response = await request(app).get(`/api/post/${postId}`)
            .set('Authorization', 'Bearer ' + accessToken);
        expect(response.status).toBe(404);
    });

    describe('POST /post/:id/like', () => {
        let likePostId: string;

        beforeAll(async () => {
            const res = await request(app).post('/api/post')
                .set('Authorization', 'Bearer ' + accessToken)
                .send({ message: 'Like Test Post' });
            likePostId = res.body._id;
        });

        test('should like a post', async () => {
            const response = await request(app)
                .post(`/api/post/${likePostId}/like`)
                .set('Authorization', 'Bearer ' + accessToken);
            expect(response.status).toBe(201);
            expect(response.body.likeCount).toBe(1);
        });

        test('should return 409 when liking a post already liked', async () => {
            const response = await request(app)
                .post(`/api/post/${likePostId}/like`)
                .set('Authorization', 'Bearer ' + accessToken);
            expect(response.status).toBe(409);
        });

        test('should return 404 when liking a non-existent post', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .post(`/api/post/${fakeId}/like`)
                .set('Authorization', 'Bearer ' + accessToken);
            expect(response.status).toBe(404);
        });
    });

    describe('DELETE /post/:id/like', () => {
        let likePostId: string;

        beforeAll(async () => {
            const res = await request(app).post('/api/post')
                .set('Authorization', 'Bearer ' + accessToken)
                .send({ message: 'Unlike Test Post' });
            likePostId = res.body._id;

            await request(app)
                .post(`/api/post/${likePostId}/like`)
                .set('Authorization', 'Bearer ' + accessToken);
        });

        test('should unlike a post', async () => {
            const response = await request(app)
                .delete(`/api/post/${likePostId}/like`)
                .set('Authorization', 'Bearer ' + accessToken);
            expect(response.status).toBe(200);
            expect(response.body.likeCount).toBe(0);
        });

        test('should return 404 when unliking a post not liked', async () => {
            const response = await request(app)
                .delete(`/api/post/${likePostId}/like`)
                .set('Authorization', 'Bearer ' + accessToken);
            expect(response.status).toBe(404);
        });
    });
});
