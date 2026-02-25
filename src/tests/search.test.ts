import request from 'supertest';
import initApp from '../index';
import mongoose from 'mongoose';
import { Express } from 'express';
import User from '../models/User';
import Post from '../models/Post';
import Comment from '../models/Comment';
import Like from '../models/Like';
import llmService from '../services/llm';

// Mock the LLM service
jest.mock('../services/llm', () => ({
    parseSearchQuery: jest.fn()
}));

let app: Express;
let userId: string;
let accessToken: string;
let posts: any[] = [];

const testUser = {
    username: 'searchtest',
    email: 'search@test.com',
    password: 'password123'
};

beforeAll(async () => {
    app = await initApp();
    await User.deleteMany();
    await Post.deleteMany();
    await Comment.deleteMany();
    await Like.deleteMany();

    // Register and login user
    const userRes = await request(app).post('/api/user').send(testUser);
    userId = userRes.body._id;

    const loginRes = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: testUser.password
    });
    accessToken = loginRes.body.token;

    // Create some posts
    const post1 = await Post.create({ message: 'Hello world', author: userId, likeCount: 5 });
    const post2 = await Post.create({ message: 'Cats are great', author: userId, likeCount: 15 });
    const post3 = await Post.create({ message: 'Dogs are better', author: userId, likeCount: 2 });
    
    posts = [post1, post2, post3];

    // Add comments to post2
    await Comment.create({ body: 'Nice cat', postId: post2._id, author: userId });
    await Comment.create({ body: 'I love cats', postId: post2._id, author: userId });

    // Add 1 comment to post1
    await Comment.create({ body: 'First', postId: post1._id, author: userId });
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('Search API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('GET /post/search should return posts filtered by message', async () => {
        (llmService.parseSearchQuery as jest.Mock).mockResolvedValue({
            message: 'cat'
        });

        const response = await request(app)
            .get('/api/post/search?query=find posts about cats')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(1);
        expect(response.body[0].message).toContain('Cats');
    });

    test('GET /post/search should return posts filtered by likeCount', async () => {
        (llmService.parseSearchQuery as jest.Mock).mockResolvedValue({
            likeCount: { $gte: 10 }
        });

        const response = await request(app)
            .get('/api/post/search?query=popular posts')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(1);
        expect(response.body[0].likeCount).toBeGreaterThanOrEqual(10);
        expect(response.body[0].message).toBe('Cats are great');
    });

    test('GET /post/search should return posts filtered by commentsCount', async () => {
        (llmService.parseSearchQuery as jest.Mock).mockResolvedValue({
            commentsCount: { $eq: 2 }
        });

        const response = await request(app)
            .get('/api/post/search?query=posts with 2 comments')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(1);
        expect(response.body[0].message).toBe('Cats are great');
        expect(response.body[0].commentsCount).toBe(2);
    });

    test('GET /post/search should work with combined filters', async () => {
        (llmService.parseSearchQuery as jest.Mock).mockResolvedValue({
            message: 'Dog',
            likeCount: { $lte: 5 }
        });

        const response = await request(app)
            .get('/api/post/search?query=dogs with few likes')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(1);
        expect(response.body[0].message).toContain('Dogs');
    });

    test('GET /post/search should return 400 if query is missing', async () => {
        const response = await request(app)
            .get('/api/post/search')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(400);
    });

    test('GET /post/search should return empty list if no matches', async () => {
        (llmService.parseSearchQuery as jest.Mock).mockResolvedValue({
            message: 'nonexistent'
        });

        const response = await request(app)
            .get('/api/post/search?query=something')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    test('GET /post/search should return all matching posts without pagination', async () => {
        (llmService.parseSearchQuery as jest.Mock).mockResolvedValue({});

        const response = await request(app)
            .get('/api/post/search?query=all')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(3);
    });
});
