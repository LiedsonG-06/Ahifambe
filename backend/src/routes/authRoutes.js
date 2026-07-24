const express = require('express');

const authController = require('../controllers/authController');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));
router.get('/me', authenticate, asyncHandler(authController.me));

module.exports = router;
