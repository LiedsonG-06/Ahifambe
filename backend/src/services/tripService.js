const tripModel = require('../models/tripModel');
const AppError = require('../utils/AppError');

const normalizeId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const startTrip = async (tripInput) => {
  const route_id = normalizeId(tripInput.route_id);
  const driver_id = normalizeId(tripInput.driver_id);
  const vehicle_id = normalizeId(tripInput.vehicle_id);

  if (!route_id) {
    throw new AppError('route_id is required and must be a valid id.', 400);
  }

  if (!driver_id) {
    throw new AppError('driver_id is required and must be a valid id.', 400);
  }

  if (!vehicle_id) {
    throw new AppError('vehicle_id is required and must be a valid id.', 400);
  }

  const route = await tripModel.findRouteById(route_id);
  if (!route) {
    throw new AppError('Route not found.', 404);
  }

  const driver = await tripModel.findDriverById(driver_id);
  if (!driver) {
    throw new AppError('Driver not found.', 404);
  }

  const vehicle = await tripModel.findVehicleById(vehicle_id);
  if (!vehicle) {
    throw new AppError('Vehicle not found.', 404);
  }

  const activeTrip = await tripModel.findInProgressByDriverId(driver_id);
  if (activeTrip) {
    throw new AppError('Driver already has a trip in progress.', 409);
  }

  const tripId = await tripModel.create({ route_id, driver_id, vehicle_id });
  const trip = await tripModel.findById(tripId);

  return {
    message: 'Trip started successfully.',
    trip,
  };
};

const endTrip = async (idInput) => {
  const id = normalizeId(idInput);

  if (!id) {
    throw new AppError('Trip id must be a valid id.', 400);
  }

  const existingTrip = await tripModel.findById(id);
  if (!existingTrip) {
    throw new AppError('Trip not found.', 404);
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

const listActiveTrips = async () => {
  return tripModel.findActive();
};

const listTrips = async () => {
  return tripModel.findAll();
};

module.exports = {
  startTrip,
  endTrip,
  listActiveTrips,
  listTrips,
};
