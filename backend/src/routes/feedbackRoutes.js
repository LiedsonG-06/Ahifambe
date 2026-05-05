const express = require('express');

const feedbackController = require('../controllers/feedbackController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/', asyncHandler(feedbackController.submitFeedback));
router.get('/driver/:driver_id', asyncHandler(feedbackController.listDriverFeedback));
router.get('/', asyncHandler(feedbackController.listFeedback));

module.exports = router;
