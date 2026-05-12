const express = require('express');

const feedbackController = require('../controllers/feedbackController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('passenger', 'driver'), asyncHandler(feedbackController.submitFeedback));
router.post('/trip-rating', authorize('passenger'), asyncHandler(feedbackController.submitTripRating));
router.get('/driver/:driver_id', authorize('admin'), asyncHandler(feedbackController.listDriverFeedback));
router.get('/', authorize('admin'), asyncHandler(feedbackController.listFeedback));
router.patch('/:id/status', authorize('admin'), asyncHandler(feedbackController.updateFeedbackStatus));

module.exports = router;
