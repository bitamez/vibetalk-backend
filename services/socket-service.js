
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { sendMessage } from './message-service.js';

const onlineUsers = new Map();

async function isConversationMember(conversationId, userId) {
  const { rowCount } = await query(
    `SELECT 1
     FROM conversation_members
     WHERE conversation_id = $1 AND user_id = $2`,
    [conversationId, userId]
  );

  return rowCount > 0;
}

export function configureSocket(io) {
  // Authenticate socket connections
  io.use(async (socket, next) => {
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

      const payload = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ['HS256'],
      });

      const userId = payload.sub || payload.id || payload.userId;

      if (!userId) {
        return next(new Error('Invalid token payload'));
      }

      const { rows } = await query(
        'SELECT id, username FROM users WHERE id = $1',
        [userId]
      );

      if (!rows[0]) {
        return next(new Error('User not found'));
      }

      socket.data.user = rows[0];
      next();
    } catch (error) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.user.id;

    socket.join(`user:${userId}`);

    // Track multiple connections per user
    const count = (onlineUsers.get(userId) || 0) + 1;
    onlineUsers.set(userId, count);

    if (count === 1) {
      io.emit('presence:update', {
        userId,
        online: true,
      });
    }

    // Join conversation room
    socket.on('conversation:join', async ({ conversationId } = {}) => {
      try {
        if (!conversationId) return;

        const allowed = await isConversationMember(
          conversationId,
          userId
        );

        if (!allowed) {
          socket.emit('socket:error', {
            message: 'You are not a member of this conversation',
          });
          return;
        }

        socket.join(`conversation:${conversationId}`);
      } catch (error) {
        console.error('Conversation join error:', error.message);
      }
    });

    // Send message
    socket.on('message:send', async (payload, ack) => {
      try {
        const message = await sendMessage(userId, payload || {});

        io.to(`conversation:${message.conversation_id}`).emit(
          'message:new',
          message
        );

        if (typeof ack === 'function') {
          ack({ ok: true, message });
        }
      } catch (error) {
        if (typeof ack === 'function') {
          ack({
            ok: false,
            message: error.message || 'Failed to send message',
          });
        }
      }
    });

    // Typing indicators
    const handleTyping = async (payload, typing) => {
      try {
        const conversationId = payload?.conversationId;

        if (!conversationId) return;

        const allowed = await isConversationMember(
          conversationId,
          userId
        );

        if (!allowed) return;

        socket.to(`conversation:${conversationId}`).emit(
          'typing:update',
          {
            conversationId,
            userId,
            typing,
          }
        );
      } catch (error) {
        console.error('Typing event error:', error.message);
      }
    };

    socket.on('typing:start', (payload) => {
      handleTyping(payload, true);
    });

    socket.on('typing:stop', (payload) => {
      handleTyping(payload, false);
    });

    // Disconnect
    socket.on('disconnect', () => {
      const remaining = (onlineUsers.get(userId) || 1) - 1;

      if (remaining <= 0) {
        onlineUsers.delete(userId);

        io.emit('presence:update', {
          userId,
          online: false,
        });
      } else {
        onlineUsers.set(userId, remaining);
      }
    });
  });
}
