const authService = require('../services/authService');

const register = async (req, res) => {
  const { nome, name, email, password, role } = req.body;

  const result = await authService.register({
    name: nome || name,
    email,
    password,
    role,
  });

  res.status(201).json(result);
};

const login = async (req, res) => {
  const result = await authService.login(req.body);
  res.status(200).json(result);
};

module.exports = {
  register,
  login,
};
