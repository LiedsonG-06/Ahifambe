const vehicleModel = require('../models/vehicleModel');
const driverModel = require('../models/driverModel');
const AppError = require('../utils/AppError');

const ALLOWED_STATUSES = new Set(['active', 'inactive', 'maintenance']);
const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '');
const normalizeDriverId = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};
const normalizeVehicleId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const validateInput = async (input, excludeId = null, fixedDriverId = undefined) => {
  const plate_number = normalizeString(input.plate_number);
  const model = normalizeString(input.model);
  const capacity = Number(input.capacity);
  const status = normalizeString(input.status || 'active').toLowerCase();
  const hasDriverId = Object.prototype.hasOwnProperty.call(input, 'driver_id');
  const driver_id = fixedDriverId === undefined ? normalizeDriverId(input.driver_id) : fixedDriverId;

  if (!plate_number) throw new AppError('plate_number is required.', 400);
  if (!model) throw new AppError('model is required.', 400);
  if (!Number.isInteger(capacity) || capacity <= 0) throw new AppError('capacity is required and must be greater than 0.', 400);
  if (!ALLOWED_STATUSES.has(status)) throw new AppError('Invalid vehicle status.', 400);
  if (fixedDriverId === undefined && hasDriverId && input.driver_id !== null && input.driver_id !== '' && !driver_id) {
    throw new AppError('driver_id must be a valid driver id.', 400);
  }
  if (driver_id && !(await driverModel.findById(driver_id))) throw new AppError('Driver not found.', 404);
  if (await vehicleModel.findByPlateNumber(plate_number, excludeId)) throw new AppError('plate_number is already registered.', 409);

  return { driver_id, plate_number, model, capacity, status };
};

const getActiveDriver = async (userId) => {
  const driver = await driverModel.findByUserId(userId);
  if (!driver) throw new AppError('Driver profile not found for authenticated user.', 403);
  if (driver.status !== 'active') throw new AppError('Driver profile is not active.', 403);
  return driver;
};

const assertDriverOwnership = async (vehicle, user) => {
  if (user?.role !== 'driver') return null;
  const driver = await getActiveDriver(user.id);
  if (Number(vehicle.driver_id) !== Number(driver.id)) throw new AppError('Driver does not own this vehicle.', 403);
  return driver;
};

const createVehicle = async (input, user) => {
  const driver = await getActiveDriver(user.id);
  const data = await validateInput(input, null, driver.id);
  let id;
  try { id = await vehicleModel.create(data); }
  catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') throw new AppError('plate_number is already registered.', 409);
    throw error;
  }
  return { message: 'Vehicle created successfully.', vehicle: await vehicleModel.findById(id) };
};

const listVehicles = async (user) => {
  if (user?.role === 'driver') {
    const driver = await getActiveDriver(user.id);
    return vehicleModel.findByDriverId(driver.id);
  }
  return vehicleModel.findAll();
};

const updateVehicle = async (idInput, input, user) => {
  const id = normalizeVehicleId(idInput);
  if (!id) throw new AppError('Valid vehicle id is required.', 400);
  const current = await vehicleModel.findById(id);
  if (!current) throw new AppError('Vehicle not found.', 404);
  const driver = await assertDriverOwnership(current, user);
  const data = await validateInput(input, id, driver ? driver.id : undefined);
  const active = await vehicleModel.hasInProgressTrip(id);
  if (active && Number(data.driver_id) !== Number(current.driver_id)) throw new AppError('Vehicle cannot be transferred while it has a trip in progress.', 409);
  if (active && data.status !== 'active') throw new AppError('Vehicle cannot be deactivated while it has a trip in progress.', 409);
  try { await vehicleModel.update(id, data); }
  catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') throw new AppError('plate_number is already registered.', 409);
    throw error;
  }
  return { message: 'Vehicle updated successfully.', vehicle: await vehicleModel.findById(id) };
};

const updateVehicleStatus = async ({ vehicleId, status, user }) => {
  const id = normalizeVehicleId(vehicleId);
  const normalizedStatus = normalizeString(status).toLowerCase();
  if (!id) throw new AppError('Valid vehicle id is required.', 400);
  if (!ALLOWED_STATUSES.has(normalizedStatus)) throw new AppError('Invalid vehicle status.', 400);
  const vehicle = await vehicleModel.findById(id);
  if (!vehicle) throw new AppError('Vehicle not found.', 404);
  await assertDriverOwnership(vehicle, user);
  if (normalizedStatus !== 'active' && await vehicleModel.hasInProgressTrip(id)) throw new AppError('Vehicle cannot be deactivated while it has a trip in progress.', 409);
  await vehicleModel.updateStatus(id, normalizedStatus);
  return { message: 'Vehicle status updated successfully.', vehicle: await vehicleModel.findById(id) };
};

const deleteVehicle = async (idInput, user) => {
  const id = normalizeVehicleId(idInput);
  if (!id) throw new AppError('Valid vehicle id is required.', 400);
  const vehicle = await vehicleModel.findById(id);
  if (!vehicle) throw new AppError('Vehicle not found.', 404);
  await assertDriverOwnership(vehicle, user);
  if (await vehicleModel.hasInProgressTrip(id)) throw new AppError('Vehicle cannot be deleted while it has a trip in progress.', 409);
  if (await vehicleModel.hasAnyTrip(id)) throw new AppError('Vehicle cannot be deleted because it is linked to trip history.', 409);
  try { await vehicleModel.remove(id); }
  catch (error) {
    if (error?.code === 'ER_ROW_IS_REFERENCED_2') throw new AppError('Vehicle cannot be deleted because it is linked to trips.', 409);
    throw error;
  }
  return { message: 'Vehicle deleted successfully.' };
};

module.exports = { createVehicle, listVehicles, updateVehicle, updateVehicleStatus, deleteVehicle };