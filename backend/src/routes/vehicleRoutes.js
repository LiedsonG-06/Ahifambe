const express = require('express');

const vehicleController = require('../controllers/vehicleController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('admin'), asyncHandler(vehicleController.createVehicle));
router.get('/', authorize('admin'), asyncHandler(vehicleController.listVehicles));

module.exports = router;
