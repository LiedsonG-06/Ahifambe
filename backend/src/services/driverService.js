const driverModel = require('../models/driverModel');
const userModel = require('../models/userModel');
const AppError = require('../utils/AppError');

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '');

const normalizeOptionalString = (value) => {
  const normalizedValue = normalizeString(value);
  return normalizedValue || null;
};

const normalizeUserId = (value) => {
  const userId = Number(value);
  return Number.isInteger(userId) && userId > 0 ? userId : null;
};

const createDriver = async (driverInput) => {
  const user_id = normalizeUserId(driverInput.user_id);
  const license_number = normalizeOptionalString(driverInput.license_number);
  const phone = normalizeOptionalString(driverInput.phone);

  if (!user_id) {
    throw new AppError('user_id is required.', 400);
  }

  const user = await userModel.findById(user_id);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  if (user.role !== 'driver') {
    throw new AppError('User must have driver role.', 400);
  }

  const existingDriver = await driverModel.findByUserId(user_id);

  if (existingDriver) {
    throw new AppError('Driver already exists for this user_id.', 409);
  }

  const driverId = await driverModel.create({
    user_id,
    license_number,
    phone,
  });
  const driver = await driverModel.findById(driverId);

  return {
    message: 'Driver created successfully.',
    driver,
  };
};

const listDrivers = async () => {
  return driverModel.findAll();
};

module.exports = {
  createDriver,
  listDrivers,
};
