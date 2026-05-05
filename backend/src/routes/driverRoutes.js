const express = require('express');

const driverController = require('../controllers/driverController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/', asyncHandler(driverController.createDriver));
router.get('/', asyncHandler(driverController.listDrivers));

module.exports = router;
