const routeService = require('../services/routeService');

const createRoute = async (req, res) => {
  const result = await routeService.createRoute(req.body);
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
