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

  let tripId;
  try {
    tripId = await tripModel.createWithRouteAssignment({
      route_id,
      driver_id: driver.id,
      vehicle_id,
    });
  } catch (error) {
    if (error.code === 'ACTIVE_TRIP_EXISTS') {
      throw new AppError('Driver already has a trip in progress.', 409);
    }
    if (error.code === 'ROUTE_ALREADY_ASSIGNED') {
      throw new AppError('Route has already been assigned to another driver.', 409);
    }
    if (error.code === 'ROUTE_NOT_FOUND') {
      throw new AppError('Route not found.', 404);
    }
    throw error;
  }
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

  const affectedRows = await tripModel.complete(id);
  if (affectedRows !== 1) throw new AppError('Trip is no longer in progress.', 409);
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

  const affectedRows = await tripModel.updateLotacao(id, lotacao);
  if (affectedRows !== 1) throw new AppError('Trip is no longer in progress.', 409);
  const trip = await tripModel.findById(id);

  return {
    message: 'Trip status updated successfully.',
    trip,
  };
};

const listActiveTrips = async () => {
  const trips = await tripModel.findActive();
  return trips.map((trip) => ({
    trip_id: trip.id,
    route_name: trip.route_nome,
    origin: trip.origem,
    destination: trip.destino,
    plate_number: trip.plate_number,
    model: trip.model,
    capacity: trip.capacity,
    lotacao: trip.lotacao,
    departure_time: trip.departure_time,
    latitude: trip.latest_latitude,
    longitude: trip.latest_longitude,
    location_updated_at: trip.latest_location_at,
  }));
};

const TRIP_STATUSES = new Set(['scheduled', 'in_progress', 'completed', 'finished', 'cancelled']);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const listTrips = async (query = {}) => {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 20);
  if (!Number.isInteger(page) || page < 1) throw new AppError('page must be a positive integer.', 400);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new AppError('limit must be between 1 and 100.', 400);
  const status = String(query.status || '').trim();
  if (status && !TRIP_STATUSES.has(status)) throw new AppError('Invalid trip status.', 400);
  const parseOptionalId = (name) => {
    if (query[name] === undefined || query[name] === '') return null;
    const id = normalizeId(query[name]);
    if (!id) throw new AppError(`${name} must be a valid id.`, 400);
    return id;
  };
  const date_from = String(query.date_from || '').trim();
  const date_to = String(query.date_to || '').trim();
  if (date_from && !DATE_PATTERN.test(date_from)) throw new AppError('date_from must use YYYY-MM-DD.', 400);
  if (date_to && !DATE_PATTERN.test(date_to)) throw new AppError('date_to must use YYYY-MM-DD.', 400);
  if (date_from && date_to && date_from > date_to) throw new AppError('date_from cannot be after date_to.', 400);
  const filters = { status, driver_id: parseOptionalId('driver_id'), route_id: parseOptionalId('route_id'), vehicle_id: parseOptionalId('vehicle_id'), date_from, date_to, search: String(query.search || '').trim().slice(0, 120), limit, offset: (page - 1) * limit };
  const [trips, total] = await Promise.all([tripModel.findAll(filters), tripModel.countAll(filters)]);
  return { trips, pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } };
};

const getTripDetails = async (idInput) => {
  const id = normalizeId(idInput);
  if (!id) throw new AppError('Trip id must be a valid id.', 400);
  const trip = await tripModel.findById(id);
  if (!trip) throw new AppError('Trip not found.', 404);
  return { trip };
};

const getMyActiveTrip = async (userIdInput) => {
  const user_id = normalizeId(userIdInput);
  if (!user_id) throw new AppError('Authenticated user is required.', 401);
  const driver = await driverModel.findByUserId(user_id);
  if (!driver) throw new AppError('Driver profile not found for authenticated user.', 404);
  ensureActiveDriver(driver);
  return { trip: await tripModel.findActiveDetailsByDriverId(driver.id) };
};

module.exports = {
  startTrip,
  endTrip,
  updateTripStatus,
  listActiveTrips,
  listTrips,
  getTripDetails,
  getMyActiveTrip,
};
