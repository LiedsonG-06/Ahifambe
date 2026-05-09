const express = require('express');

const rideRequestController = require('../controllers/rideRequestController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('passenger'), asyncHandler(rideRequestController.createRideRequest));
router.get('/driver', authorize('driver'), asyncHandler(rideRequestController.listDriverRequests));
router.get('/passenger', authorize('passenger'), asyncHandler(rideRequestController.listPassengerRequests));
router.patch('/:id/accept', authorize('driver'), asyncHandler(rideRequestController.acceptRideRequest));
router.patch('/:id/reject', authorize('driver'), asyncHandler(rideRequestController.rejectRideRequest));

module.exports = router;
