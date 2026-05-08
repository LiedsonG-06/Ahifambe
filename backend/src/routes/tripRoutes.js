const express = require('express');

const tripController = require('../controllers/tripController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);

router.post('/start', authorize('driver'), asyncHandler(tripController.startTrip));
router.patch('/:id/end', authorize('driver'), asyncHandler(tripController.endTrip));
router.get('/active', authorize('admin', 'passenger'), asyncHandler(tripController.listActiveTrips));
router.get('/', authorize('admin'), asyncHandler(tripController.listTrips));

module.exports = router;
