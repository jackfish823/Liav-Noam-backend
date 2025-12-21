import express, { Express } from 'express';
import dotenv from 'dotenv';
import connectDB from './db-connection.js';

import postRoutes from './controllers/posts.js';
import commentsRoutes from './controllers/comments.js';

dotenv.config();

void connectDB();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.json());

app.use('/post', postRoutes);
app.use('/comments', commentsRoutes);

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
