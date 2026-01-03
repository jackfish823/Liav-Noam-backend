import request from 'supertest';
import initApp from '../index';
import mongoose from 'mongoose';
import {Express} from 'express';
import User from '../models/User';

let app: Express;
let userId: string;

beforeAll(async () => {
    app = await initApp();
    await User.deleteMany();
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('Users API', () => {
    test('GET /user should return empty array initially', async () => {
        const response = await request(app).get('/user');
        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    test('POST /user should create a new user', async () => {
        const response = await request(app).post('/user').send({
            username: 'testuser',
            email: 'test@test.com',
            password: 'password'
        });
        expect(response.status).toBe(201);
        expect(response.body.username).toBe('testuser');
        expect(response.body.email).toBe('test@test.com');
        userId = response.body._id;
    });

    test('POST /user should fail with duplicate email', async () => {
        const response = await request(app).post('/user').send({
            username: 'testuser2',
            email: 'test@test.com', // Duplicate email
            password: 'password'
        });
        expect(response.status).toBe(409);
    });

    test('POST /user should return 400 for missing required fields (email)', async () => {
        const response = await request(app).post('/user').send({
            username: 'testuser3',
            // Missing email
        });
        expect(response.status).toBe(400);
    });

    test('GET /user should return all users', async () => {
        const response = await request(app).get('/user');
        expect(response.status).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].username).toBe('testuser');
    });

    test('GET /user/:id should return a user by id', async () => {
        const response = await request(app).get(`/user/${userId}`);
        expect(response.status).toBe(200);
        expect(response.body.username).toBe('testuser');
    });

    test('GET /user/:id should return 404 for non-existent id', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(app).get(`/user/${fakeId}`);
        expect(response.status).toBe(404);
    });

    test('GET /user/:id should return 500 for invalid id format', async () => {
        const response = await request(app).get(`/user/invalid-id`);
        expect(response.status).toBe(500);
    });

    test('PUT /user/:id should update a user', async () => {
        const response = await request(app).put(`/user/${userId}`).send({
            username: 'updateduser',
            email: 'updated@test.com',
        });
        expect(response.status).toBe(200);
        expect(response.body.username).toBe('updateduser');
        expect(response.body.email).toBe('updated@test.com');
    });

    test('PUT /user/:id should return 404 for non-existent id', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(app).put(`/user/${fakeId}`).send({
            username: 'updateduser',
            email: 'updated@test.com',
        });
        expect(response.status).toBe(404);
    });

    test('PUT /user/:id should return 500 for invalid id format', async () => {
        const response = await request(app).put(`/user/invalid-id`).send({
            username: 'updateduser',
            email: 'updated@test.com',
        });
        expect(response.status).toBe(500);
    });

    test('DELETE /user/:id should delete a user', async () => {
        const response = await request(app).delete(`/user/${userId}`);
        expect(response.status).toBe(200);
    });

    test('DELETE /user/:id should return 404 for non-existent id', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(app).delete(`/user/${fakeId}`);
        expect(response.status).toBe(404);
    });

    test('DELETE /user/:id should return 500 for invalid id format', async () => {
        const response = await request(app).delete(`/user/invalid-id`);
        expect(response.status).toBe(500);
    });

    test('GET /user/:id should return 404 after delete', async () => {
        const response = await request(app).get(`/user/${userId}`);
        expect(response.status).toBe(404);
    });
});
