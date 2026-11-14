
export const validate = (schema) => {
  return (req, res, next) => {
    // Validate request body, URL parameters, and query parameters
    const parsed = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    // Return validation errors
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    // Store validated request data
    req.validated = parsed.data;

    // Replace request body with validated and sanitized data
    if (parsed.data.body !== undefined) {
      req.body = parsed.data.body;
    }

    next();
  };
};
