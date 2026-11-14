
import * as messages from '../services/message-service.js';

// ===============================
// GET MESSAGES FOR A CONVERSATION
// ===============================

export const list = async (req, res, next) => {
  try {
    const result = await messages.getMessages(
      req.params.conversationId,
      req.user.id,
      req.query.before,
      req.query.beforeId
    );

    res.status(200).json({
      success: true,
      messages: result,
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// SEND A MESSAGE + SOCKET EVENT
// ===============================

export const create = async (req, res, next) => {
  try {
    const message = await messages.sendMessage(
      req.user.id,
      req.body
    );

    // Broadcast the saved message to everyone in the conversation.
    const io = req.app.get('io');

    if (io && message?.conversation_id) {
      io.to(`conversation:${message.conversation_id}`).emit(
        'message:new',
        message
      );
    }

    res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// MARK CONVERSATION MESSAGES AS READ
// ===============================

export const read = async (req, res, next) => {
  try {
    const receipt = await messages.markRead(
      req.params.id,
      req.user.id
    );

    res.status(200).json({
      success: true,
      receipt,
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// DELETE MESSAGE + SOCKET EVENT
// ===============================

export const remove = async (req, res, next) => {
  try {
    const result = await messages.deleteMessage(
      req.params.id,
      req.user.id
    );

    const io = req.app.get('io');

    if (io) {
      io.to(`conversation:${result.conversationId}`).emit(
        'message:deleted',
        {
          id: result.id,
          conversationId: result.conversationId,
          deletedAt: result.deletedAt,
          deletedBy: req.user.id,
        }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
      deletedMessage: result,
    });
  } catch (error) {
    next(error);
  }
};
