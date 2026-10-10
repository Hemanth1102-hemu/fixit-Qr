import { ZodError } from 'zod';

export function errorHandler(err, req, res, next) {
  // Structured logging of error
  console.error(`[ERROR] ${new Date().toISOString()} ${req.method} ${req.url}:`, {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const issues = err.issues.map(issue => ({
      path: issue.path.join('.'),
      message: issue.message
    }));
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Invalid request data provided',
      issues
    });
  }

  // Handle custom HTTP status errors
  const status = err.status || err.statusCode || 500;
  const message = status === 500 && process.env.NODE_ENV === 'production'
    ? 'Internal server error occurred'
    : (err.message || 'An unexpected error occurred');

  res.status(status).json({
    success: false,
    error: err.name || 'ServerError',
    message
  });
}
