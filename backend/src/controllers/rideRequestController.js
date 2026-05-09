const rideRequestService = require('../services/rideRequestService');

const createRideRequest = async (req, res) => {
  const result = await rideRequestService.createRideRequest({
    ...req.body,
    user_id: req.user.id,
  });

  res.status(201).json(result);
};

const listDriverRequests = async (req, res) => {
  const rideRequests = await rideRequestService.listDriverRequests(req.user.id);
  res.status(200).json(rideRequests);
};

const listPassengerRequests = async (req, res) => {
  const rideRequests = await rideRequestService.listPassengerRequests(req.user.id);
  res.status(200).json(rideRequests);
};

const acceptRideRequest = async (req, res) => {
  const result = await rideRequestService.updateDriverRequestStatus(req.params.id, req.user.id, 'accepted');
  res.status(200).json(result);
};

const rejectRideRequest = async (req, res) => {
  const result = await rideRequestService.updateDriverRequestStatus(req.params.id, req.user.id, 'rejected');
  res.status(200).json(result);
};

module.exports = {
  createRideRequest,
  listDriverRequests,
  listPassengerRequests,
  acceptRideRequest,
  rejectRideRequest,
};
