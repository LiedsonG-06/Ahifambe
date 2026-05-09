const vehicleModel = require('../models/vehicleModel');
const driverModel = require('../models/driverModel');
const AppError = require('../utils/AppError');

const ALLOWED_VEHICLE_STATUSES = new Set(['active', 'inactive', 'maintenance']);

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

const createVehicle = async (vehicleInput) => {
  const plate_number = normalizeString(vehicleInput.plate_number);
  const model = normalizeString(vehicleInput.model);
  const capacity = Number(vehicleInput.capacity);
  let driver_id = normalizeDriverId(vehicleInput.driver_id);
  const user = vehicleInput.user;

  if (!plate_number) {
    throw new AppError('plate_number is required.', 400);
  }

  if (!user) {
    throw new AppError('Authenticated user is required.', 401);
  }

  if (!Number.isInteger(capacity) || capacity <= 0) {
    throw new AppError('capacity is required and must be greater than 0.', 400);
  }

  if (user.role === 'driver') {
    if (Object.prototype.hasOwnProperty.call(vehicleInput, 'driver_id')) {
      throw new AppError('driver_id must not be sent by driver users.', 400);
    }

    const driver = await driverModel.findByUserId(user.id);

    if (!driver) {
      throw new AppError('Driver profile not found for authenticated user.', 404);
    }

    ensureActiveDriver(driver);

    driver_id = driver.id;
  }

  const existingVehicle = await vehicleModel.findByPlateNumber(plate_number);

  if (existingVehicle) {
    throw new AppError('plate_number is already registered.', 409);
  }

  const vehicleId = await vehicleModel.create({
    driver_id,
    plate_number,
    model,
    capacity,
  });
  const vehicle = await vehicleModel.findById(vehicleId);

  return {
    message: 'Vehicle created successfully.',
    vehicle,
  };
};

const listVehicles = async (user) => {
  if (user?.role === 'driver') {
    const driver = await driverModel.findByUserId(user.id);

    if (!driver) {
      throw new AppError('Driver profile not found for authenticated user.', 404);
    }

    return vehicleModel.findByDriverId(driver.id);
  }

  return vehicleModel.findAll();
};

const updateVehicleStatus = async ({ vehicleId, status, user }) => {
  const normalizedStatus = normalizeString(status).toLowerCase();
  const normalizedVehicleId = Number(vehicleId);

  if (!Number.isInteger(normalizedVehicleId) || normalizedVehicleId <= 0) {
    throw new AppError('Valid vehicle id is required.', 400);
  }

  if (!ALLOWED_VEHICLE_STATUSES.has(normalizedStatus)) {
    throw new AppError('Invalid vehicle status.', 400);
  }

  if (!user) {
    throw new AppError('Authenticated user is required.', 401);
  }

  const vehicle = await vehicleModel.findById(normalizedVehicleId);

  if (!vehicle) {
    throw new AppError('Vehicle not found.', 404);
  }

  if (user.role === 'driver') {
    const driver = await driverModel.findByUserId(user.id);

    if (!driver) {
      throw new AppError('Driver profile not found for authenticated user.', 404);
    }

    ensureActiveDriver(driver);

    if (Number(vehicle.driver_id) !== Number(driver.id)) {
      throw new AppError('You do not have permission to update this vehicle.', 403);
    }
  }

  await vehicleModel.updateStatus(normalizedVehicleId, normalizedStatus);
  const updatedVehicle = await vehicleModel.findById(normalizedVehicleId);

  return {
    message: 'Vehicle status updated successfully.',
    vehicle: updatedVehicle,
  };
};

module.exports = {
  createVehicle,
  listVehicles,
  updateVehicleStatus,
};
