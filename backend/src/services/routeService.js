const routeModel = require('../models/routeModel');
const AppError = require('../utils/AppError');

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '');

const createRoute = async (routeInput) => {
  const nome = normalizeString(routeInput.nome);
  const origem = normalizeString(routeInput.origem);
  const destino = normalizeString(routeInput.destino);

  if (!nome || !origem || !destino) {
    throw new AppError('nome, origem and destino are required.', 400);
  }

  const routeId = await routeModel.create({ nome, origem, destino });
  const route = await routeModel.findById(routeId);

  return {
    message: 'Route created successfully.',
    route,
  };
};

const listRoutes = async () => {
  return routeModel.findAll();
};

module.exports = {
  createRoute,
  listRoutes,
};
