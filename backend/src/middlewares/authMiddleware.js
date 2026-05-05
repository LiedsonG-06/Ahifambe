const jwt = require('jsonwebtoken');

const env = require('../config/env');
const AppError = require('../utils/AppError');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication token is required.', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    req.user = jwt.verify(token, env.jwt.secret);
    return next();
  } catch (error) {
    return next(new AppError('Invalid or expired authentication token.', 401));
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to access this resource.', 403));
  }

  return next();
};

module.exports = {
  authenticate,
  authorize,
};
