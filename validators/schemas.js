
import { z } from 'zod';

// Common request structure
const requestSchema = (body) =>
  z.object({
    body,
    params: z.object({}).strict(),
    query: z.object({}).strict(),
  }).strict();

// ===============================
// USER REGISTRATION
// ===============================

export const registerSchema = requestSchema(
  z.object({
    username: z
      .string()
      .trim()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username cannot exceed 30 characters')
      .regex(
        /^[a-zA-Z0-9_]+$/,
        'Username can only contain letters, numbers, and underscores'
      ),

    fullName: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name cannot exceed 100 characters'),

    email: z
      .string()
      .trim()
      .email('Invalid email address')
      .max(255, 'Email cannot exceed 255 characters')
      .transform((value) => value.toLowerCase()),

    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password cannot exceed 128 characters'),
  }).strict()
);

// ===============================
// USER LOGIN
// ===============================

export const loginSchema = requestSchema(
  z.object({
    email: z
      .string()
      .trim()
      .email('Invalid email address')
      .transform((value) => value.toLowerCase()),

    password: z
      .string()
      .min(1, 'Password is required')
      .max(128, 'Password cannot exceed 128 characters'),
  }).strict()
);

// ===============================
// UPDATE USER PROFILE
// ===============================

export const updateProfileSchema = requestSchema(
  z.object({
    username: z
      .string()
      .trim()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username cannot exceed 30 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Invalid username')
      .optional(),

    fullName: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name cannot exceed 100 characters')
      .optional(),

    bio: z
      .string()
      .trim()
      .max(160, 'Bio cannot exceed 160 characters')
      .optional(),

    avatarUrl: z
      .string()
      .url('Invalid avatar URL')
      .max(1000, 'Avatar URL is too long')
      .nullable()
      .optional(),
  })
    .strict()
    .refine(
      (data) => Object.keys(data).length > 0,
      {
        message: 'At least one field must be provided',
      }
    )
);

// ===============================
// SEND MESSAGE
// ===============================

export const messageSchema = requestSchema(
  z.object({
    conversationId: z
      .string()
      .uuid('Invalid conversation ID'),

    body: z
      .string()
      .trim()
      .min(1, 'Message cannot be empty')
      .max(5000, 'Message cannot exceed 5000 characters'),
  }).strict()
);

// ===============================
// CREATE CONVERSATION
// ===============================

export const conversationSchema = requestSchema(
  z.object({
    isGroup: z
      .boolean()
      .default(false),

    name: z
      .string()
      .trim()
      .min(1, 'Group name is required')
      .max(80, 'Group name cannot exceed 80 characters')
      .optional(),

    memberIds: z
      .array(z.string().uuid('Invalid member ID'))
      .min(1, 'At least one member is required')
      .max(50, 'Maximum 50 members allowed')
      .refine(
        (ids) => new Set(ids).size === ids.length,
        'Duplicate member IDs are not allowed'
      ),
  })
    .strict()
    .refine(
      (data) => !data.isGroup || Boolean(data.name),
      {
        message: 'Group conversations must have a name',
        path: ['name'],
      }
    )
);
