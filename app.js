
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth-routes.js';
import userRoutes from './routes/user-routes.js';
import conversationRoutes from './routes/conversation-routes.js';
import messageRoutes from './routes/message-routes.js';

import {
  notFound,
  errorHandler,
} from './middleware/error-middleware.js';

const app = express();

// ==============================
// GLOBAL MIDDLEWARE
// ==============================

const allowedOrigins = [
  'http://localhost:5173',
  'http://10.171.51.200:5173',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==============================
// ROOT ROUTE
// ==============================

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to VibeTalk API!',
    status: 'Running',
    version: '1.0.0',
  });
});

// ==============================
// API ROUTES
// ==============================

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);

// ==============================
// 404 HANDLER
// ==============================

app.use(notFound);

// ==============================
// GLOBAL ERROR HANDLER
// ==============================

app.use(errorHandler);

export default app;
