import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import postsRoutes from './routes/posts.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/college-media')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'College Media Backend Running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});