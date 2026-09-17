/**
 * Centralized API Error Handling Middleware
 * Ensures uniform error responses across all routes without leaking internals or credentials.
 */
export function errorMiddleware(err, req, res, next) {
  // Safe logging without secrets or headers
  const isDev = process.env.NODE_ENV !== 'production';
  
  if (err.name === 'SyntaxError' && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON payload in request body.',
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  
  let userMessage = err.message || 'An unexpected server error occurred. Please try again later.';

  // Mask database / internal technical details in production
  if (statusCode === 500 && !isDev) {
    userMessage = 'An internal server error occurred. Please try again later.';
  }

  if (statusCode >= 500) {
    console.error(`[API Server Error ${statusCode}] ${req.method} ${req.originalUrl}:`, err.message || err);
  }

  res.status(statusCode).json({
    success: false,
    message: userMessage,
  });
}
