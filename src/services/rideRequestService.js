import api from './api'

export function createRideRequest(payload) {
  return api.post('/ride-requests', payload).then((response) => response.data)
}

export function getDriverRideRequests() {
  return api.get('/ride-requests/driver').then((response) => {
    return Array.isArray(response.data) ? response.data : response.data?.ride_requests || []
  })
}

export function getPassengerRideRequests() {
  return api.get('/ride-requests/passenger').then((response) => {
    return Array.isArray(response.data) ? response.data : response.data?.ride_requests || []
  })
}

export function acceptRideRequest(id) {
  return api.patch(`/ride-requests/${id}/accept`).then((response) => response.data)
}

export function rejectRideRequest(id) {
  return api.patch(`/ride-requests/${id}/reject`).then((response) => response.data)
}
