import request from 'supertest';
import initApp from '../index';
import mongoose from 'mongoose';
import {Express} from 'express';
import User from '../models/User';
import Post from '../models/Post';
import Comment from '../models/Comment';

let app: Express;
let userId: string;
let postId: string;
let commentId: string;

beforeAll(async () => {
  app = await initApp();
  await User.deleteMany();
  await Post.deleteMany();
  await Comment.deleteMany();

  // Create User
  const userResponse = await request(app).post('/user').send({
    username: 'commentuser',
    email: 'comment@test.com',
  });
  userId = userResponse.body._id;

  // Create Post
  const postResponse = await request(app).post('/post').send({
    message: 'Post for comments',
    author: userId,
  });
  postId = postResponse.body._id;
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Comments API', () => {
  test('GET /comment should return empty array initially', async () => {
    const response = await request(app).get('/comment');
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  test('POST /comment should create a new comment', async () => {
    const response = await request(app).post('/comment').send({
      body: 'Test Comment',
      postId: postId,
      author: userId,
    });
    expect(response.status).toBe(201);
    expect(response.body.body).toBe('Test Comment');
    expect(response.body.postId).toBe(postId);
    expect(response.body.author).toBe(userId);
    commentId = response.body._id;
  });

  test('POST /comment should return 500 for missing required fields', async () => {
    const response = await request(app).post('/comment').send({
      body: 'Test Comment',
      // Missing postId and author
    });
    expect(response.status).toBe(500);
  });

  test('GET /comment should return all comments', async () => {
    const response = await request(app).get('/comment');
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].body).toBe('Test Comment');
    // Check population
    expect(response.body[0].author._id).toBe(userId);
  });

  test('GET /comment?postId=ID should return comments for a post', async () => {
    const response = await request(app).get(`/comment?postId=${postId}`);
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].postId).toBe(postId);
  });

  test('GET /comment?author=ID should return comments by author', async () => {
    const response = await request(app).get(`/comment?author=${userId}`);
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].author._id).toBe(userId);
  });

  test('GET /comment/:id should return a comment by id', async () => {
    const response = await request(app).get(`/comment/${commentId}`);
    expect(response.status).toBe(200);
    expect(response.body.body).toBe('Test Comment');
  });

  test('GET /comment/:id should return 500 for invalid id format', async () => {
    const response = await request(app).get(`/comment/invalid-id`);
    expect(response.status).toBe(500);
  });

  test('PUT /comment/:id should update a comment', async () => {
    const response = await request(app).put(`/comment/${commentId}`).send({
      body: 'Updated Comment',
    });
    expect(response.status).toBe(200);
    expect(response.body.body).toBe('Updated Comment');
  });

  test('PUT /comment/:id should return 404 for non-existent id', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const response = await request(app).put(`/comment/${fakeId}`).send({
      body: 'Updated Comment',
    });
    expect(response.status).toBe(404);
  });

  test('PUT /comment/:id should return 500 for invalid id format', async () => {
    const response = await request(app).put(`/comment/invalid-id`).send({
      body: 'Updated Comment',
    });
    expect(response.status).toBe(500);
  });

  test('DELETE /comment/:id should delete a comment', async () => {
    const response = await request(app).delete(`/comment/${commentId}`);
    expect(response.status).toBe(200);
  });

  test('DELETE /comment/:id should return 404 for non-existent id', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const response = await request(app).delete(`/comment/${fakeId}`);
    expect(response.status).toBe(404);
  });

  test('DELETE /comment/:id should return 500 for invalid id format', async () => {
    const response = await request(app).delete(`/comment/invalid-id`);
    expect(response.status).toBe(500);
  });

  test('GET /comment/:id should return 404 after delete', async () => {
    const response = await request(app).get(`/comment/${commentId}`);
    expect(response.status).toBe(404);
  });
});
