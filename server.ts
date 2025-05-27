import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize } from './config/db';
import errorHandler from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import postsRoutes from './routes/postsRoutes';

// Load environment variables
dotenv.config();

// Initialize express app
const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', authRoutes);
app.use('/api', postsRoutes);

// Error handler middleware
app.use(errorHandler);

// Define port
const PORT = process.env.PORT || 5001;

// Sync database and start server
sequelize.sync({ alter: process.env.NODE_ENV === 'development' })
  .then(() => {
    console.log('Database connected');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });