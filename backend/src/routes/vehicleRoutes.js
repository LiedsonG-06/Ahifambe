const express = require('express');

const vehicleController = require('../controllers/vehicleController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/', asyncHandler(vehicleController.createVehicle));
router.get('/', asyncHandler(vehicleController.listVehicles));

module.exports = router;
