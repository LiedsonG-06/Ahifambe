const express = require('express');

const tripController = require('../controllers/tripController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/start', asyncHandler(tripController.startTrip));
router.patch('/:id/end', asyncHandler(tripController.endTrip));
router.get('/active', asyncHandler(tripController.listActiveTrips));
router.get('/', asyncHandler(tripController.listTrips));

module.exports = router;
