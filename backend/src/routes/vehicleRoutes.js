const express = require('express');

const vehicleController = require('../controllers/vehicleController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('admin', 'driver'), asyncHandler(vehicleController.createVehicle));
router.get('/', authorize('admin', 'driver'), asyncHandler(vehicleController.listVehicles));
router.patch('/:id/status', authorize('admin', 'driver'), asyncHandler(vehicleController.updateVehicleStatus));

module.exports = router;
