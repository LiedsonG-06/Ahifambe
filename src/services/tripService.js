import api from './api'

export function startTrip({ route_id, vehicle_id }) {
  return api.post('/trips/start', { route_id, vehicle_id }).then((response) => response.data)
}

export function endTrip(id) {
  return api.patch(`/trips/${id}/end`).then((response) => response.data)
}

export function updateTripStatus(id, { lotacao }) {
  return api.patch(`/trips/${id}/status`, { lotacao }).then((response) => response.data)
}
