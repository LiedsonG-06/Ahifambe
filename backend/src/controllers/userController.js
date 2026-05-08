const userService = require('../services/userService');

const listUsers = async (req, res) => {
  const users = await userService.listUsers();
  res.status(200).json(users);
};

const blockUser = async (req, res) => {
  const result = await userService.blockUser(req.params.id);
  res.status(200).json(result);
};

const unblockUser = async (req, res) => {
  const result = await userService.unblockUser(req.params.id);
  res.status(200).json(result);
};

const deleteUser = async (req, res) => {
  const result = await userService.deleteUser(req.params.id, req.user.id);
  res.status(200).json(result);
};

module.exports = {
  listUsers,
  blockUser,
  unblockUser,
  deleteUser,
};
