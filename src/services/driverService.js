import api from './api'

export function getDrivers() {
  return api.get('/drivers').then((response) => response.data)
}
