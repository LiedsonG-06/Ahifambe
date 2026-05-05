const express = require('express');

const routeController = require('../controllers/routeController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/', asyncHandler(routeController.createRoute));
router.get('/', asyncHandler(routeController.listRoutes));

module.exports = router;
