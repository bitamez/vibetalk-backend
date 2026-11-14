
export function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(err, req, res, next) {
  console.error(err);

  // Duplicate email or username
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'Email or username already exists',
    });
  }

  // Foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced resource does not exist',
    });
  }

  // Invalid UUID
  if (err.code === '22P02') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
    });
  }

  const status = err.status || err.statusCode || 500;

  res.status(status).json({
    success: false,
    message:
      status < 500
        ? err.message
        : 'Internal server error',
  });
}
