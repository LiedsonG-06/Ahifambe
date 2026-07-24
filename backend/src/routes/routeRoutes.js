const express = require('express');

const routeController = require('../controllers/routeController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('admin'), asyncHandler(routeController.createRoute));
router.get('/', authorize('admin', 'passenger', 'driver'), asyncHandler(routeController.listRoutes));
router.put('/:id', authorize('admin'), asyncHandler(routeController.updateRoute));
router.delete('/:id', authorize('admin'), asyncHandler(routeController.deleteRoute));

module.exports = router;
