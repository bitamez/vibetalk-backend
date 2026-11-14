
import * as authService from '../services/auth-service.js';

// ===================================
// REGISTER
// ===================================

export const register = async (req, res, next) => {
  try {
    const { username, fullName, email, password } = req.body;

    if (!username || !fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    const user = await authService.registerUser({
      username: username.trim(),
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user,
    });
  } catch (error) {
    if (
      error.message === 'EMAIL_OR_USERNAME_EXISTS' ||
      error.code === '23505'
    ) {
      return res.status(409).json({
        success: false,
        message: 'Email or username already exists',
      });
    }

    next(error);
  }
};

// ===================================
// LOGIN
// ===================================

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const result = await authService.loginUser({
      email: email.trim().toLowerCase(),
      password,
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      ...result,
    });
  } catch (error) {
    if (error.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    next(error);
  }
};
