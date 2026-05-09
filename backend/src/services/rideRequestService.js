const rideRequestModel = require('../models/rideRequestModel');
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

const getPassengerForUser = async (userIdInput) => {
  const userId = normalizeId(userIdInput);

  if (!userId) {
    throw new AppError('Authenticated user is required.', 401);
  }

  const passenger = await rideRequestModel.findPassengerByUserId(userId);
  if (!passenger) {
    throw new AppError('Passenger profile not found for authenticated user.', 404);
  }

  return passenger;
};

const getDriverForUser = async (userIdInput) => {
  const userId = normalizeId(userIdInput);

  if (!userId) {
    throw new AppError('Authenticated user is required.', 401);
  }

  const driver = await rideRequestModel.findDriverByUserId(userId);
  if (!driver) {
    throw new AppError('Driver profile not found for authenticated user.', 404);
  }

  return driver;
};

const createRideRequest = async (requestInput) => {
  const passenger = await getPassengerForUser(requestInput.user_id);
  const driver_id = normalizeId(requestInput.driver_id);
  const trip_id = normalizeId(requestInput.trip_id);
  const passenger_latitude = normalizeCoordinate(requestInput.passenger_latitude);
  const passenger_longitude = normalizeCoordinate(requestInput.passenger_longitude);
  const destination = String(requestInput.destination || '').trim();
  const people_count = Number(requestInput.people_count);
  const note = String(requestInput.note || '').trim();

  if (!driver_id) {
    throw new AppError('driver_id is required and must be a valid id.', 400);
  }

  if (!trip_id) {
    throw new AppError('trip_id is required and must be a valid id.', 400);
  }

  if (passenger_latitude === null) {
    throw new AppError('passenger_latitude is required and must be numeric.', 400);
  }

  if (passenger_longitude === null) {
    throw new AppError('passenger_longitude is required and must be numeric.', 400);
  }

  if (!destination) {
    throw new AppError('destination is required.', 400);
  }

  if (!Number.isInteger(people_count) || people_count <= 0) {
    throw new AppError('people_count is required and must be greater than 0.', 400);
  }

  const trip = await rideRequestModel.findTripById(trip_id);
  if (!trip) {
    throw new AppError('Trip not found.', 404);
  }

  if (trip.status !== 'in_progress') {
    throw new AppError('Trip must be in progress to receive ride requests.', 400);
  }

  if (Number(trip.driver_id) !== Number(driver_id)) {
    throw new AppError('driver_id does not belong to the indicated trip.', 400);
  }

  const rideRequestId = await rideRequestModel.create({
    passenger_id: passenger.id,
    driver_id,
    trip_id,
    passenger_latitude,
    passenger_longitude,
    destination,
    people_count,
    note,
  });

  const rideRequest = await rideRequestModel.findById(rideRequestId);

  return {
    message: 'Ride request created successfully.',
    ride_request: rideRequest,
  };
};

const listDriverRequests = async (userId) => {
  const driver = await getDriverForUser(userId);
  return rideRequestModel.findForDriver(driver.id);
};

const listPassengerRequests = async (userId) => {
  const passenger = await getPassengerForUser(userId);
  return rideRequestModel.findForPassenger(passenger.id);
};

const updateDriverRequestStatus = async (requestIdInput, userIdInput, status) => {
  const id = normalizeId(requestIdInput);
  const driver = await getDriverForUser(userIdInput);

  if (!id) {
    throw new AppError('Ride request id must be a valid id.', 400);
  }

  const rideRequest = await rideRequestModel.findById(id);
  if (!rideRequest) {
    throw new AppError('Ride request not found.', 404);
  }

  if (Number(rideRequest.driver_id) !== Number(driver.id)) {
    throw new AppError('Driver does not own this ride request.', 403);
  }

  if (rideRequest.status !== 'pending') {
    throw new AppError('Only pending ride requests can be updated.', 400);
  }

  await rideRequestModel.updateStatus(id, status);
  const updatedRideRequest = await rideRequestModel.findById(id);

  return {
    message: `Ride request ${status} successfully.`,
    ride_request: updatedRideRequest,
  };
};

module.exports = {
  createRideRequest,
  listDriverRequests,
  listPassengerRequests,
  updateDriverRequestStatus,
};
