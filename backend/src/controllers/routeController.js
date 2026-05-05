const routeService = require('../services/routeService');

const createRoute = async (req, res) => {
  const { nome, origem, destino } = req.body;

  const result = await routeService.createRoute({
    nome,
    origem,
    destino,
  });

  res.status(201).json(result);
};

const listRoutes = async (req, res) => {
  const routes = await routeService.listRoutes();
  res.status(200).json(routes);
};

module.exports = {
  createRoute,
  listRoutes,
};
