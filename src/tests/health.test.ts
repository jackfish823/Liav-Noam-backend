import request from 'supertest';
import initApp from '../index';
import mongoose from 'mongoose';
import { Express } from 'express';

let app: Express;

beforeAll(async () => {
    app = await initApp();
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('Health Check API', () => {
    test('GET /health should return 200 and status ok', async () => {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'ok');
        expect(response.body).toHaveProperty('uptime');
        expect(response.body).toHaveProperty('timestamp');
    });
});
