import api from './api'

export function updateLocation({ trip_id, latitude, longitude }) {
  return api.post('/locations/update', { trip_id, latitude, longitude }).then((response) => response.data)
}
