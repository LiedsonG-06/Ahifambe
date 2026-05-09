const tripModel = require('../models/tripModel');
const driverModel = require('../models/driverModel');
const AppError = require('../utils/AppError');

const normalizeId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const LOTACAO_OPTIONS = new Set(['vazio', 'intermedio', 'lotado']);

const ensureActiveDriver = (driver) => {
  if (driver.status !== 'active') {
    throw new AppError('Driver account is not active.', 403);
  }
};

const startTrip = async (tripInput) => {
  const route_id = normalizeId(tripInput.route_id);
  const user_id = normalizeId(tripInput.user_id);
  const vehicle_id = normalizeId(tripInput.vehicle_id);

  if (!route_id) {
    throw new AppError('route_id is required and must be a valid id.', 400);
  }

  if (!user_id) {
    throw new AppError('Authenticated user is required.', 401);
  }

  if (!vehicle_id) {
    throw new AppError('vehicle_id is required and must be a valid id.', 400);
  }

  const route = await tripModel.findRouteById(route_id);
  if (!route) {
    throw new AppError('Route not found.', 404);
  }

  const driver = await driverModel.findByUserId(user_id);
  if (!driver) {
    throw new AppError('Driver profile not found for authenticated user.', 404);
  }

  ensureActiveDriver(driver);

  if (Number(route.driver_id) !== Number(driver.id)) {
    throw new AppError('Route does not belong to this driver.', 403);
  }

  const vehicle = await tripModel.findVehicleById(vehicle_id);
  if (!vehicle) {
    throw new AppError('Vehicle not found.', 404);
  }

  if (vehicle.status !== 'active') {
    throw new AppError('Vehicle is not active.', 400);
  }

  if (Number(vehicle.driver_id) !== Number(driver.id)) {
    throw new AppError('Vehicle does not belong to this driver.', 400);
  }

  const activeTrip = await tripModel.findInProgressByDriverId(driver.id);
  if (activeTrip) {
    throw new AppError('Driver already has a trip in progress.', 409);
  }

  const tripId = await tripModel.create({ route_id, driver_id: driver.id, vehicle_id });
  const trip = await tripModel.findById(tripId);

  return {
    message: 'Trip started successfully.',
    trip,
  };
};

const endTrip = async (idInput, userIdInput) => {
  const id = normalizeId(idInput);
  const user_id = normalizeId(userIdInput);

  if (!id) {
    throw new AppError('Trip id must be a valid id.', 400);
  }

  if (!user_id) {
    throw new AppError('Authenticated user is required.', 401);
  }

  const existingTrip = await tripModel.findById(id);
  if (!existingTrip) {
    throw new AppError('Trip not found.', 404);
  }

  const driver = await driverModel.findByUserId(user_id);
  if (!driver) {
    throw new AppError('Driver profile not found for authenticated user.', 404);
  }

  if (Number(existingTrip.driver_id) !== Number(driver.id)) {
    throw new AppError('Driver does not belong to the indicated trip.', 400);
  }

  if (existingTrip.status !== 'in_progress') {
    throw new AppError('Only trips in progress can be ended.', 400);
  }

  await tripModel.complete(id);
  const trip = await tripModel.findById(id);

  return {
    message: 'Trip ended successfully.',
    trip,
  };
};

const updateTripStatus = async (idInput, userIdInput, statusInput) => {
  const id = normalizeId(idInput);
  const user_id = normalizeId(userIdInput);
  const lotacao = String(statusInput?.lotacao || '').trim().toLowerCase();

  if (!id) {
    throw new AppError('Trip id must be a valid id.', 400);
  }

  if (!user_id) {
    throw new AppError('Authenticated user is required.', 401);
  }

  if (!LOTACAO_OPTIONS.has(lotacao)) {
    throw new AppError('lotacao must be one of: vazio, intermedio, lotado.', 400);
  }

  const existingTrip = await tripModel.findById(id);
  if (!existingTrip) {
    throw new AppError('Trip not found.', 404);
  }

  const driver = await driverModel.findByUserId(user_id);
  if (!driver) {
    throw new AppError('Driver profile not found for authenticated user.', 404);
  }

  ensureActiveDriver(driver);

  if (Number(existingTrip.driver_id) !== Number(driver.id)) {
    throw new AppError('Driver does not belong to the indicated trip.', 400);
  }

  if (existingTrip.status !== 'in_progress') {
    throw new AppError('Only trips in progress can update lotacao.', 400);
  }

  await tripModel.updateLotacao(id, lotacao);
  const trip = await tripModel.findById(id);

  return {
    message: 'Trip status updated successfully.',
    trip,
  };
};

const listActiveTrips = async () => {
  return tripModel.findActive();
};

const listTrips = async () => {
  return tripModel.findAll();
};

module.exports = {
  startTrip,
  endTrip,
  updateTripStatus,
  listActiveTrips,
  listTrips,
};
