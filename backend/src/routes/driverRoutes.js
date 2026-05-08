const express = require('express');

const driverController = require('../controllers/driverController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('admin'), asyncHandler(driverController.createDriver));
router.get('/', authorize('admin'), asyncHandler(driverController.listDrivers));

module.exports = router;
