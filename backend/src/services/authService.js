const bcrypt = require('bcrypt');

const env = require('../config/env');
const userModel = require('../models/userModel');
const driverModel = require('../models/driverModel');
const passengerModel = require('../models/passengerModel');
const { pool } = require('../config/db');
const { generateToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');

const VALID_ROLES = ['admin', 'driver', 'passenger'];
const PUBLIC_REGISTRATION_ROLES = ['driver', 'passenger'];
const BLOCKED_ACCOUNT_MESSAGE = 'A sua conta foi bloqueada. Contacte o administrador do sistema.';

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const register = async ({ name, email, password, role }) => {
  const normalizedName = typeof name === 'string' ? name.trim() : '';
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const normalizedRole = typeof role === 'string' ? role.trim().toLowerCase() : '';

  if (!normalizedName || !normalizedEmail || !password || !normalizedRole) {
    throw new AppError('Nome, email, password and role are required.', 400);
  }

  if (!VALID_ROLES.includes(normalizedRole)) {
    throw new AppError('Invalid role. Use admin, driver or passenger.', 400);
  }

  if (!PUBLIC_REGISTRATION_ROLES.includes(normalizedRole)) {
    throw new AppError('Public registration of admin accounts is not allowed.', 403);
  }

  const existingUser = await userModel.findByEmail(normalizedEmail);

  if (existingUser) {
    throw new AppError('Email is already registered.', 409);
  }

  const passwordHash = await bcrypt.hash(password, env.bcryptSaltRounds);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const userId = await userModel.create(
      {
        name: normalizedName,
        email: normalizedEmail,
        passwordHash,
        role: normalizedRole,
      },
      connection
    );

    if (normalizedRole === 'driver') {
      await driverModel.createForUser(userId, connection);
    }

    if (normalizedRole === 'passenger') {
      await passengerModel.createForUser(userId, connection);
    }

    await connection.commit();

    const user = {
      id: userId,
      name: normalizedName,
      email: normalizedEmail,
      role: normalizedRole,
    };
    const token = generateToken(user);

    return {
      message: 'User registered successfully.',
      user: sanitizeUser(user),
      token,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const login = async ({ email, password }) => {
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!normalizedEmail || !password) {
    throw new AppError('Email and password are required.', 400);
  }

  const user = await userModel.findByEmail(normalizedEmail);

  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (user.status === 'blocked') {
    throw new AppError(BLOCKED_ACCOUNT_MESSAGE, 403);
  }

  const token = generateToken(user);

  return {
    message: 'Login successful.',
    user: sanitizeUser(user),
    token,
  };
};

module.exports = {
  register,
  login,
};
