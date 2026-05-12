import api from './api'

export function getFeedback() {
  return api.get('/feedback').then((response) => response.data)
}

export function createFeedback(feedback) {
  return api.post('/feedback', feedback).then((response) => response.data)
}

export function updateFeedbackStatus(feedbackId, status) {
  return api.patch(`/feedback/${feedbackId}/status`, { status }).then((response) => response.data)
}
