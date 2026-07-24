const jwt = require('jsonwebtoken');

const env = require('../config/env');
const userModel = require('../models/userModel');
const AppError = require('../utils/AppError');

const VALID_ROLES = new Set(['admin', 'driver', 'passenger']);
const BLOCKED_ACCOUNT_MESSAGE = 'A sua conta foi bloqueada. Contacte o administrador do sistema.';

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication token is required.', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedUser = jwt.verify(token, env.jwt.secret, { algorithms: [env.jwt.algorithm] });
    const user = await userModel.findById(decodedUser.id);

    if (!user) {
      return next(new AppError('Authenticated user no longer exists.', 401));
    }

    if (user.status === 'blocked') {
      return next(new AppError(BLOCKED_ACCOUNT_MESSAGE, 403));
    }

    if (!VALID_ROLES.has(user.role)) {
      return next(new AppError('Authenticated user role is invalid.', 403));
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    return next();
  } catch {
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
