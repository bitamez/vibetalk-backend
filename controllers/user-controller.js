
import * as users from '../services/user-service.js';
import cloudinary from '../config/cloudinary.js';
// ===============================
// GET CURRENT USER PROFILE
// ===============================
export const me = async (req, res, next) => {
  try {
    const user = await users.getMe(req.user.id);

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// UPDATE CURRENT USER PROFILE
// ===============================
export const updateMe = async (req, res, next) => {
  try {
    const user = await users.updateMe(req.user.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// SEARCH USERS
// ===============================
export const search = async (req, res, next) => {
  try {
    const query = req.query.q || '';

    const result = await users.searchUsers(
      req.user.id,
      query
    );

    res.status(200).json({
      success: true,
      users: result
    });
  } catch (error) {
    next(error);
  }
};


// ===============================
// UPLOAD PROFILE PHOTO
// ===============================

export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select an image to upload.',
      });
    }

    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return res.status(500).json({
        success: false,
        message: 'Cloudinary is not configured.',
      });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'vibetalk/avatars',
          resource_type: 'image',
          transformation: [
            {
              width: 500,
              height: 500,
              crop: 'fill',
              gravity: 'face',
              quality: 'auto',
              fetch_format: 'auto',
            },
          ],
        },
        (error, uploadedImage) => {
          if (error) {
            reject(error);
          } else {
            resolve(uploadedImage);
          }
        }
      );

      stream.end(req.file.buffer);
    });

    const user = await users.updateMe(req.user.id, {
      avatarUrl: result.secure_url,
    });

    res.status(200).json({
      success: true,
      message: 'Profile photo updated successfully.',
      user,
    });
  } catch (error) {
    next(error);
  }
};
