const tripService = require('../services/tripService');

const startTrip = async (req, res) => {
  const { route_id, vehicle_id } = req.body;

  const result = await tripService.startTrip({
    route_id,
    vehicle_id,
    user_id: req.user.id,
  });

  res.status(201).json(result);
};

const endTrip = async (req, res) => {
  const result = await tripService.endTrip(req.params.id, req.user.id);
  res.status(200).json(result);
};

const updateTripStatus = async (req, res) => {
  const result = await tripService.updateTripStatus(req.params.id, req.user.id, req.body);
  res.status(200).json(result);
};

const listActiveTrips = async (req, res) => {
  const trips = await tripService.listActiveTrips();
  res.status(200).json(trips);
};

const listTrips = async (req, res) => {
  res.status(200).json(await tripService.listTrips(req.query));
};

const getTripDetails = async (req, res) => {
  res.status(200).json(await tripService.getTripDetails(req.params.id));
};

const getMyActiveTrip = async (req, res) => {
  const result = await tripService.getMyActiveTrip(req.user.id);
  res.status(200).json(result);
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
