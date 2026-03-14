import request from 'supertest';
import initApp from '../index';
import mongoose from 'mongoose';
import {Express} from 'express';

let app: Express;
const PROTECTED_ROUTE = '/api/post';

beforeAll(async () => {
    app = await initApp();
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('Auth Middleware', () => {
    test('should return 401 if Authorization header is missing', async () => {
        const response = await request(app).post(PROTECTED_ROUTE).send({
            message: 'Test Message'
        });
        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Invalid or missing authorization token');
    });

    test('should return 401 if Authorization header does not start with Bearer', async () => {
        const response = await request(app).post(PROTECTED_ROUTE)
            .set('Authorization', 'Basic sometoken')
            .send({
                message: 'Test Message'
            });
        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Invalid or missing authorization token');
    });

    test('should return 401 if Authorization header has no token', async () => {
        const response = await request(app).post(PROTECTED_ROUTE)
            .set('Authorization', 'Bearer ')
            .send({
                message: 'Test Message'
            });
        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Invalid or missing authorization token');
    });

    test('should return 403 if token is invalid', async () => {
        const response = await request(app).post(PROTECTED_ROUTE)
            .set('Authorization', 'Bearer invalid_token')
            .send({
                message: 'Test Message'
            });
        expect(response.status).toBe(403);
        expect(response.body.message).toBe('Invalid or expired token');
    });
});
