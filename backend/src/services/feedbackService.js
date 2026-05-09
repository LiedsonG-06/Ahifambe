const feedbackModel = require('../models/feedbackModel');
const AppError = require('../utils/AppError');

const normalizeId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const normalizeRating = (value) => {
  const rating = Number(value);
  return Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null;
};

const submitFeedback = async (feedbackInput) => {
  const user_id = normalizeId(feedbackInput.user_id);
  const trip_id = normalizeId(feedbackInput.trip_id);
  const rating = normalizeRating(feedbackInput.rating);
  const comment = feedbackInput.comment || null;

  if (!user_id) {
    throw new AppError('Authenticated user is required.', 401);
  }

  if (!trip_id) {
    throw new AppError('trip_id is required and must be a valid id.', 400);
  }

  if (!rating) {
    throw new AppError('rating is required and must be an integer between 1 and 5.', 400);
  }

  const passenger = await feedbackModel.findPassengerByUserId(user_id);
  if (!passenger) {
    throw new AppError('Passenger not found.', 404);
  }

  const passenger_id = passenger.id;

  const trip = await feedbackModel.findTripById(trip_id);
  if (!trip) {
    throw new AppError('Trip not found.', 404);
  }

  if (trip.status !== 'completed') {
    throw new AppError('Feedback can only be submitted for completed trips.', 400);
  }

  const existingFeedback = await feedbackModel.findByPassengerAndTrip(passenger_id, trip_id);
  if (existingFeedback) {
    throw new AppError('Feedback already submitted for this passenger and trip.', 409);
  }

  const feedbackId = await feedbackModel.create({
    passenger_id,
    trip_id,
    rating,
    comment,
  });

  const feedback = await feedbackModel.findById(feedbackId);

  return {
    message: 'Feedback submitted successfully.',
    feedback,
  };
};

const listFeedback = async () => {
  return feedbackModel.findAll();
};

const listDriverFeedback = async (driverIdInput) => {
  const driver_id = normalizeId(driverIdInput);

  if (!driver_id) {
    throw new AppError('driver_id must be a valid id.', 400);
  }

  const driver = await feedbackModel.findDriverById(driver_id);
  if (!driver) {
    throw new AppError('Driver not found.', 404);
  }

  const [summary, feedbacks] = await Promise.all([
    feedbackModel.getDriverFeedbackSummary(driver_id),
    feedbackModel.findByDriverId(driver_id),
  ]);

  return {
    driver_id,
    average_rating: summary.average_rating ? Number(summary.average_rating) : null,
    total_feedbacks: Number(summary.total_feedbacks) || 0,
    comments: feedbacks,
  };
};

module.exports = {
  submitFeedback,
  listFeedback,
  listDriverFeedback,
};
