const routeModel = require('../models/routeModel');
const driverModel = require('../models/driverModel');
const AppError = require('../utils/AppError');

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '');

const normalizeDriverId = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const driverId = Number(value);
  return Number.isInteger(driverId) && driverId > 0 ? driverId : null;
};

const ensureActiveDriver = (driver) => {
  if (driver.status !== 'active') {
    throw new AppError('Driver account is not active.', 403);
  }
};

const createRoute = async (routeInput) => {
  const nome = normalizeString(routeInput.nome);
  const origem = normalizeString(routeInput.origem);
  const destino = normalizeString(routeInput.destino);
  const user = routeInput.user;
  let driver_id = normalizeDriverId(routeInput.driver_id);

  if (!nome || !origem || !destino) {
    throw new AppError('nome, origem and destino are required.', 400);
  }

  if (!user) {
    throw new AppError('Authenticated user is required.', 401);
  }

  if (user.role === 'driver') {
    if (Object.prototype.hasOwnProperty.call(routeInput, 'driver_id')) {
      throw new AppError('driver_id must not be sent by driver users.', 400);
    }

    const driver = await driverModel.findByUserId(user.id);

    if (!driver) {
      throw new AppError('Driver profile not found for authenticated user.', 404);
    }

    ensureActiveDriver(driver);

    driver_id = driver.id;
  } else if (driver_id) {
    const driver = await driverModel.findById(driver_id);

    if (!driver) {
      throw new AppError('Driver not found.', 404);
    }
  }

  const routeId = await routeModel.create({ driver_id, nome, origem, destino });
  const route = await routeModel.findById(routeId);

  return {
    message: 'Route created successfully.',
    route,
  };
};

const listRoutes = async (user) => {
  if (user?.role === 'driver') {
    const driver = await driverModel.findByUserId(user.id);

    if (!driver) {
      throw new AppError('Driver profile not found for authenticated user.', 404);
    }

    return routeModel.findByDriverId(driver.id);
  }

  return routeModel.findAll();
};

const updateRoute = async (routeId, routeInput) => {
  const id = Number(routeId);
  const nome = normalizeString(routeInput.nome);
  const origem = normalizeString(routeInput.origem);
  const destino = normalizeString(routeInput.destino);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('Route id is invalid.', 400);
  }

  if (!nome || !origem || !destino) {
    throw new AppError('nome, origem and destino are required.', 400);
  }

  const route = await routeModel.findById(id);

  if (!route) {
    throw new AppError('Route not found.', 404);
  }

  await routeModel.update(id, { nome, origem, destino });
  const updatedRoute = await routeModel.findById(id);

  return {
    message: 'Route updated successfully.',
    route: updatedRoute,
  };
};

const deleteRoute = async (routeId) => {
  const id = Number(routeId);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('Route id is invalid.', 400);
  }

  const route = await routeModel.findById(id);

  if (!route) {
    throw new AppError('Route not found.', 404);
  }

  try {
    await routeModel.remove(id);
  } catch (error) {
    if (error?.code === 'ER_ROW_IS_REFERENCED_2') {
      throw new AppError('Route cannot be deleted because it is linked to trips.', 409);
    }

    throw error;
  }

  return {
    message: 'Route deleted successfully.',
  };
};

module.exports = {
  createRoute,
  listRoutes,
  updateRoute,
  deleteRoute,
};
