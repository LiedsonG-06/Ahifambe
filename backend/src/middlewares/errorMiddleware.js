const env = require('../config/env');

const errorMiddleware = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    message: error.message || 'Internal server error.',
    ...(env.nodeEnv === 'development' && { stack: error.stack }),
  });
};

module.exports = errorMiddleware;
