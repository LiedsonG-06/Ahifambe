const routeService = require('../services/routeService');

const createRoute = async (req, res) => {
  const { driver_id, nome, origem, destino } = req.body;
  const routeInput = {
    nome,
    origem,
    destino,
    user: req.user,
  };

  if (Object.prototype.hasOwnProperty.call(req.body, 'driver_id')) {
    routeInput.driver_id = driver_id;
  }

  const result = await routeService.createRoute(routeInput);

  res.status(201).json(result);
};

const listRoutes = async (req, res) => {
  const routes = await routeService.listRoutes(req.user);
  res.status(200).json(routes);
};

const updateRoute = async (req, res) => {
  const result = await routeService.updateRoute(req.params.id, req.body);
  res.status(200).json(result);
};

const deleteRoute = async (req, res) => {
  const result = await routeService.deleteRoute(req.params.id);
  res.status(200).json(result);
};

module.exports = {
  createRoute,
  listRoutes,
  updateRoute,
  deleteRoute,
};
