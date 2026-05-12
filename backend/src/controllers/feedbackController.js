const feedbackService = require('../services/feedbackService');

const submitFeedback = async (req, res) => {
  const { type, message, trip_id } = req.body;

  const result = await feedbackService.submitFeedback({
    user_id: req.user.id,
    role: req.user.role,
    type,
    message,
    trip_id,
  });

  res.status(201).json(result);
};

const submitTripRating = async (req, res) => {
  const { trip_id, rating, comment } = req.body;

  const result = await feedbackService.submitTripRating({
    user_id: req.user.id,
    trip_id,
    rating,
    comment,
  });

  res.status(201).json(result);
};

const listFeedback = async (req, res) => {
  const feedback = await feedbackService.listFeedback();
  res.status(200).json(feedback);
};

const listDriverFeedback = async (req, res) => {
  const feedback = await feedbackService.listDriverFeedback(req.params.driver_id);
  res.status(200).json(feedback);
};

const updateFeedbackStatus = async (req, res) => {
  const result = await feedbackService.updateFeedbackStatus(req.params.id, req.body.status);
  res.status(200).json(result);
};

module.exports = {
  submitFeedback,
  submitTripRating,
  listFeedback,
  listDriverFeedback,
  updateFeedbackStatus,
};
