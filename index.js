import express from 'express';
import dotenv from 'dotenv';
import connectDB from './db-connection.js';
import postRoutes from './controllers/posts.js';

dotenv.config();

void connectDB();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({extended: true, limit: '1mb'}));
app.use(express.json());

app.use('/post', postRoutes);

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
