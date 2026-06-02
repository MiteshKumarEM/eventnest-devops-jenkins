const AppError = require('../utils/AppError');

function notFoundHandler(req, res, next) {
  if (req.path.startsWith('/api/')) {
    next(new AppError('API route not found.', 404));
    return;
  }
  next();
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }

  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? 'An unexpected server error occurred.' : error.message;

  if (statusCode === 500) {
    console.error(error);
  }

  res.status(statusCode).json({ error: message });
}

module.exports = { notFoundHandler, errorHandler };
