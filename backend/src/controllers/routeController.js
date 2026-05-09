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

module.exports = {
  createRoute,
  listRoutes,
};
