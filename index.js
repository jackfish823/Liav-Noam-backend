import express from 'express';
import dotenv from 'dotenv';
import connectDB from './db-connection.js';

dotenv.config();

connectDB();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
