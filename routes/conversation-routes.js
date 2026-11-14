
import { Router } from 'express';

import authenticateToken from '../middleware/auth-middleware.js';

import {
  list,
  create
} from '../controllers/conversation-controller.js';

import { validate } from '../middleware/validate-middleware.js';

import { conversationSchema } from '../validators/schemas.js';

const router = Router();

// Protect all conversation routes
router.use(authenticateToken);

router.get('/', list);

router.post(
  '/',
  validate(conversationSchema),
  create
);

export default router;
