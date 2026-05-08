const express = require('express');

const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('admin'), asyncHandler(userController.listUsers));
router.patch('/:id/block', authorize('admin'), asyncHandler(userController.blockUser));
router.patch('/:id/unblock', authorize('admin'), asyncHandler(userController.unblockUser));
router.delete('/:id', authorize('admin'), asyncHandler(userController.deleteUser));

module.exports = router;
