const routeModel = require('../models/routeModel');
const AppError = require('../utils/AppError');

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '');

const createRoute = async ({ nome, origem, destino }) => {
  const routeData = {
    nome: normalizeString(nome),
    origem: normalizeString(origem),
    destino: normalizeString(destino),
  };

  if (!routeData.nome || !routeData.origem || !routeData.destino) {
    throw new AppError('Nome, origem and destino are required.', 400);
  }

  const routeId = await routeModel.create(routeData);
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
