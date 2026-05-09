const locationModel = require('../models/locationModel');
const driverModel = require('../models/driverModel');
const AppError = require('../utils/AppError');

const normalizeId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const normalizeCoordinate = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
};

const updateLocation = async (locationInput) => {
  const trip_id = normalizeId(locationInput.trip_id);
  const user_id = normalizeId(locationInput.user_id);
  const latitude = normalizeCoordinate(locationInput.latitude);
  const longitude = normalizeCoordinate(locationInput.longitude);

  if (!trip_id) {
    throw new AppError('trip_id is required and must be a valid id.', 400);
  }

  if (!user_id) {
    throw new AppError('Authenticated user is required.', 401);
  }

  if (latitude === null) {
    throw new AppError('latitude is required and must be numeric.', 400);
  }

  if (longitude === null) {
    throw new AppError('longitude is required and must be numeric.', 400);
  }

  const trip = await locationModel.findTripById(trip_id);
  if (!trip) {
    throw new AppError('Trip not found.', 404);
  }

  const driver = await driverModel.findByUserId(user_id);
  if (!driver) {
    throw new AppError('Driver profile not found for authenticated user.', 404);
  }

  if (trip.status !== 'in_progress') {
    throw new AppError('Trip must be in progress to update location.', 400);
  }

  if (trip.driver_id !== driver.id) {
    throw new AppError('Driver does not belong to the indicated trip.', 400);
  }

  const locationId = await locationModel.create({
    trip_id,
    driver_id: driver.id,
    latitude,
    longitude,
  });
  const location = await locationModel.findById(locationId);

  return {
    message: 'Location updated successfully.',
    location,
  };
};

const listActiveLocations = async () => {
  return locationModel.findLatestActiveByDriver();
};

module.exports = {
  updateLocation,
  listActiveLocations,
};
