const feedbackService = require('../services/feedbackService');

const submitFeedback = async (req, res) => {
  const { passenger_id, trip_id, rating, comment } = req.body;

  const result = await feedbackService.submitFeedback({
    passenger_id,
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

module.exports = {
  submitFeedback,
  listFeedback,
  listDriverFeedback,
};
