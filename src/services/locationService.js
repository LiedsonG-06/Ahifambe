import api from './api'

export function updateLocation({ trip_id, latitude, longitude }) {
  return api.post('/locations/update', { trip_id, latitude, longitude }).then((response) => response.data)
}

export function getActiveLocations() {
  return api.get('/locations/active').then((response) => {
    return Array.isArray(response.data) ? response.data : response.data?.locations || []
  })
}
