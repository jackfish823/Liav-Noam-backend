import request from 'supertest';
import initApp from '../index';
import mongoose from 'mongoose';
import {Express} from 'express';
import User from '../models/User';

let app: Express;
let userId: string;

const testUser = {
    username: 'authtest',
    email: 'auth@test.com',
    password: 'password123',
    imgUrl: 'http://image.com/auth.jpg'
};

beforeAll(async () => {
    app = await initApp();
    await User.deleteMany();

    const response = await request(app).post('/user').send(testUser);

    userId = response.body._id;
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('Auth API', () => {
    let refreshToken: string;

    describe('POST /auth/login', () => {
        test('should login successfully with valid credentials', async () => {
            const response = await request(app).post('/auth/login').send({
                email: testUser.email,
                password: testUser.password
            });
            expect(response.status).toBe(200);
            expect(response.body.token).toBeDefined();
            expect(response.body.refreshToken).toBeDefined();
            expect(response.body._id).toBe(userId);
            refreshToken = response.body.refreshToken;
        });

        test('should fail with 400 if email is missing', async () => {
            const response = await request(app).post('/auth/login').send({
                password: testUser.password
            });
            expect(response.status).toBe(400);
        });

        test('should fail with 400 if password is missing', async () => {
            const response = await request(app).post('/auth/login').send({
                email: testUser.email
            });
            expect(response.status).toBe(400);
        });

        test('should fail with 401 if user does not exist', async () => {
            const response = await request(app).post('/auth/login').send({
                email: 'wrong@email.com',
                password: 'somepassword'
            });
            expect(response.status).toBe(401);
        });

        test('should fail with 401 if password is incorrect', async () => {
            const response = await request(app).post('/auth/login').send({
                email: testUser.email,
                password: 'wrongpassword'
            });
            expect(response.status).toBe(401);
        });
    });

    describe('POST /auth/refresh', () => {
        test('should return new tokens with valid refresh token', async () => {
            const response = await request(app).post('/auth/refresh').send({
                refreshToken
            });
            expect(response.status).toBe(200);
            expect(response.body.token).toBeDefined();
            expect(response.body.refreshToken).toBeDefined();
            expect(response.body.refreshToken).not.toBe(refreshToken);
            
            // Update refreshToken for subsequent tests
            refreshToken = response.body.refreshToken;
        });

        test('should fail with 400 if refresh token is missing', async () => {
            const response = await request(app).post('/auth/refresh').send({});
            expect(response.status).toBe(400);
        });

        test('should fail with 403 if refresh token is invalid', async () => {
            const response = await request(app).post('/auth/refresh').send({
                refreshToken: 'invalid_token'
            });
            expect(response.status).toBe(403);
        });

        test('should fail with 403 if refresh token is reused (security check)', async () => {
            // First use the token (this invalidates it)
            // We already rotated the token in the first test, but let's do it explicitly here to be sure
            
            // 1. Get a fresh valid pair
            const loginRes = await request(app).post('/auth/login').send({
                email: testUser.email,
                password: testUser.password
            });
            const freshRefreshToken = loginRes.body.refreshToken;

            // 2. Use it once (valid)
            const refreshRes1 = await request(app).post('/auth/refresh').send({
                refreshToken: freshRefreshToken
            });
            expect(refreshRes1.status).toBe(200);

            // 3. Try to use the SAME token again (reuse)
            const refreshRes2 = await request(app).post('/auth/refresh').send({
                refreshToken: freshRefreshToken
            });
            expect(refreshRes2.status).toBe(403);
        });
    });

    describe('POST /auth/logout', () => {
        let validRefreshToken: string;

        beforeEach(async () => {
            const loginRes = await request(app).post('/auth/login').send({
                email: testUser.email,
                password: testUser.password
            });
            validRefreshToken = loginRes.body.refreshToken;
        });

        test('should logout successfully with valid refresh token', async () => {
            const response = await request(app).post('/auth/logout').send({
                refreshToken: validRefreshToken
            });
            expect(response.status).toBe(200);
        });

        test('should fail with 400 if refresh token is missing', async () => {
            const response = await request(app).post('/auth/logout').send({});
            expect(response.status).toBe(400);
        });

        test('should fail with 403 if refresh token is already logged out', async () => {
            // First logout
            await request(app).post('/auth/logout').send({
                refreshToken: validRefreshToken
            });

            // Try to logout again
            const response = await request(app).post('/auth/logout').send({
                refreshToken: validRefreshToken
            });
            expect(response.status).toBe(403);
        });
    });
});

