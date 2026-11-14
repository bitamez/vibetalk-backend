
import * as conversations from '../services/conversation-service.js';

// ===================================
// GET ALL USER CONVERSATIONS
// ===================================

export const list = async (req, res, next) => {
  try {
    const result = await conversations.listConversations(
      req.user.id
    );

    res.status(200).json({
      success: true,
      conversations: result,
    });
  } catch (error) {
    next(error);
  }
};

// ===================================
// CREATE CONVERSATION
// ===================================

export const create = async (req, res, next) => {
  try {
    const conversation = await conversations.createConversation(
      req.user.id,
      req.body
    );

    res.status(201).json({
      success: true,
      conversation,
    });
  } catch (error) {
    next(error);
  }
};
