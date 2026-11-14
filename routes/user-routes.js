
import { Router } from 'express';

import {
  me,
  updateMe,
  search,
  uploadAvatar as uploadAvatarController,
} from '../controllers/user-controller.js';

import authenticateToken from '../middleware/auth-middleware.js';
import { validate } from '../middleware/validate-middleware.js';
import { uploadAvatar } from '../middleware/upload-middleware.js';

import { updateProfileSchema } from '../validators/schemas.js';

const router = Router();

// Protect all user routes
router.use(authenticateToken);

// Get current user profile
router.get('/me', me);

// Upload profile photo
router.post('/me/avatar', uploadAvatar, uploadAvatarController);

// Update profile information
router.put('/me', validate(updateProfileSchema), updateMe);

// Search users
router.get('/', search);

export default router;
