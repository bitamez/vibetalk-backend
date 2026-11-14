
import 'dotenv/config';

import http from 'node:http';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';

import app from './app.js';
import { connectDB } from './config/db.js';
import { isMember } from './services/conversation-service.js';

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const allowedOrigins = [
  'http://localhost:5173',
  'http://10.171.51.200:5173',
  process.env.CLIENT_URL,
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make Socket.IO available to Express routes
app.set('io', io);

// Authenticate Socket.IO connections
io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, '');

    if (!token) {
      return next(new Error('Authentication required'));
    }

    if (!process.env.JWT_SECRET) {
      return next(new Error('JWT_SECRET is not configured'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    });

    const userId = decoded.id || decoded.userId || decoded.sub;

    if (!userId) {
      return next(new Error('Invalid authentication token'));
    }

    socket.data.userId = userId;

    next();
  } catch (error) {
    next(new Error('Invalid or expired token'));
  }
});

// Socket.IO connection
io.on('connection', (socket) => {
  const userId = socket.data.userId;

  console.log(`User connected: ${userId} (${socket.id})`);

  // Join a conversation room
  socket.on('conversation:join', async (conversationId) => {
    try {
      if (!conversationId) return;

      const allowed = await isMember(conversationId, userId);

      if (!allowed) {
        socket.emit('socket:error', {
          message: 'You are not a member of this conversation',
        });
        return;
      }

      await socket.join(`conversation:${conversationId}`);
    } catch (error) {
      console.error('Conversation join error:', error.message);
    }
  });

  // Leave a conversation room
  socket.on('conversation:leave', (conversationId) => {
    if (!conversationId) return;

    socket.leave(`conversation:${conversationId}`);
  });

  // Handle typing indicators
  socket.on('typing:start', async (payload) => {
    try {
      const conversationId = payload?.conversationId;

      if (!conversationId) return;

      const allowed = await isMember(conversationId, userId);

      if (!allowed) return;

      socket.to(`conversation:${conversationId}`).emit('typing:start', {
        conversationId,
        userId,
      });
    } catch (error) {
      console.error('Typing start error:', error.message);
    }
  });

  socket.on('typing:stop', async (payload) => {
    try {
      const conversationId = payload?.conversationId;

      if (!conversationId) return;

      const allowed = await isMember(conversationId, userId);

      if (!allowed) return;

      socket.to(`conversation:${conversationId}`).emit('typing:stop', {
        conversationId,
        userId,
      });
    } catch (error) {
      console.error('Typing stop error:', error.message);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${userId}`);
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`VibeTalk server running on port ${PORT}`);
      console.log(`API: http://localhost:${PORT}`);
      console.log('Socket.IO is ready');
    });
  } catch (error) {
    console.error('Failed to start VibeTalk server:', error);
    process.exit(1);
  }
};

startServer();

export { app, server, io };
