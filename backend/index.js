import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import groqRoutes from './routes/groq.js';

dotenv.config();

const app = express();
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://nexa-nu-three.vercel.app/'  // Replace with your actual Vercel URL
  ],
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/groq', groqRoutes);

const PORT = process.env.PORT || 4000;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Mongo connected');
    app.listen(PORT, () => console.log('Server running on port', PORT));
  })
  .catch(err => {
    console.error('Mongo connection error:', err.message);
  });
