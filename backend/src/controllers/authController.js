const authService = require('../services/authService');

const register = async (req, res) => {
  console.log('Register request body:', req.body);

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
  console.log('Login request body:', req.body);

  const result = await authService.login(req.body);
  res.status(200).json(result);
};

module.exports = {
  register,
  login,
};
