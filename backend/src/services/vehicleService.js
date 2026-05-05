const vehicleModel = require('../models/vehicleModel');
const AppError = require('../utils/AppError');

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '');

const normalizeDriverId = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const driverId = Number(value);
  return Number.isInteger(driverId) && driverId > 0 ? driverId : null;
};

const createVehicle = async (vehicleInput) => {
  const plate_number = normalizeString(vehicleInput.plate_number);
  const model = normalizeString(vehicleInput.model);
  const capacity = Number(vehicleInput.capacity);
  const driver_id = normalizeDriverId(vehicleInput.driver_id);

  if (!plate_number) {
    throw new AppError('plate_number is required.', 400);
  }

  if (!Number.isInteger(capacity) || capacity <= 0) {
    throw new AppError('capacity is required and must be greater than 0.', 400);
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

const listVehicles = async () => {
  return vehicleModel.findAll();
};

module.exports = {
  createVehicle,
  listVehicles,
};
