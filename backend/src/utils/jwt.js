const jwt = require('jsonwebtoken');

const env = require('../config/env');

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    env.jwt.secret,
    {
      expiresIn: env.jwt.expiresIn,
    }
  );
};

module.exports = {
  generateToken,
};
