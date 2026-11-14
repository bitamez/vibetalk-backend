
import { Router } from 'express';

import authenticateToken from '../middleware/auth-middleware.js';

import {
  list,
  create,
  read,
  remove,
} from '../controllers/message-controller.js';

import { validate } from '../middleware/validate-middleware.js';

import { messageSchema } from '../validators/schemas.js';

const router = Router();

// Protect all message routes
router.use(authenticateToken);

// Get messages for a conversation
router.get('/:conversationId', list);

// Create a new message
router.post('/', validate(messageSchema), create);

// Mark conversation messages as read
router.put('/:id/read', read);

// Soft-delete a message
router.delete('/:id', remove);

export default router;
