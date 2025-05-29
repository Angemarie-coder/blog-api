import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import postsRoutes from './routes/postsRoutes';
import usersRoutes from './routes/users.routes';

// Load environment variables
dotenv.config();

// Initialize express app
const app: Application = express();
// Define port
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/blog', postsRoutes);

// Error handler middleware
app.use(errorHandler);


  // Start the server
  const startServer = async () => {
    try {
      // Initialize db connection
      await initializeDatabase();
      
      // Start Express server
      app.listen(PORT, () => {
        console.log(`Server running on localhost:${PORT}`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  };
  
  // Run the server
  startServer();