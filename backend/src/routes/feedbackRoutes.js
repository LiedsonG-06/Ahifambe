const express = require('express');

const feedbackController = require('../controllers/feedbackController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('passenger'), asyncHandler(feedbackController.submitFeedback));
router.get('/driver/:driver_id', authorize('admin'), asyncHandler(feedbackController.listDriverFeedback));
router.get('/', authorize('admin'), asyncHandler(feedbackController.listFeedback));

module.exports = router;
