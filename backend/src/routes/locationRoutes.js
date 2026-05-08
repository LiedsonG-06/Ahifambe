const express = require('express');

const locationController = require('../controllers/locationController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);

router.post('/update', authorize('driver'), asyncHandler(locationController.updateLocation));
router.get('/active', authorize('admin', 'passenger'), asyncHandler(locationController.listActiveLocations));

module.exports = router;
