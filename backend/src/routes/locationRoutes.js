const express = require('express');

const locationController = require('../controllers/locationController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/update', asyncHandler(locationController.updateLocation));
router.get('/active', asyncHandler(locationController.listActiveLocations));

module.exports = router;
