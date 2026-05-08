const userModel = require('../models/userModel');
const AppError = require('../utils/AppError');

const normalizeUserId = (value) => {
  const userId = Number(value);
  return Number.isInteger(userId) && userId > 0 ? userId : null;
};

const listUsers = async () => {
  return userModel.findAllForAdmin();
};

const updateUserStatus = async (id, status) => {
  const userId = normalizeUserId(id);

  if (!userId) {
    throw new AppError('User id must be a valid id.', 400);
  }

  const hasStatus = await userModel.hasStatusColumn();

  if (!hasStatus) {
    throw new AppError('User status column is not implemented.', 501);
  }

  const user = await userModel.findById(userId);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  await userModel.updateStatus(userId, status);

  return {
    message: `User ${status === 'blocked' ? 'blocked' : 'unblocked'} successfully.`,
  };
};

const blockUser = async (id) => {
  return updateUserStatus(id, 'blocked');
};

const unblockUser = async (id) => {
  return updateUserStatus(id, 'active');
};

const deleteUser = async (id, currentUserId) => {
  const userId = normalizeUserId(id);
  const adminUserId = normalizeUserId(currentUserId);

  if (!userId) {
    throw new AppError('User id must be a valid id.', 400);
  }

  if (adminUserId && userId === adminUserId) {
    throw new AppError('You cannot delete your own admin account.', 400);
  }

  const user = await userModel.findById(userId);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  await userModel.deleteById(userId);

  return {
    message: 'User deleted successfully.',
  };
};

module.exports = {
  listUsers,
  blockUser,
  unblockUser,
  deleteUser,
};
