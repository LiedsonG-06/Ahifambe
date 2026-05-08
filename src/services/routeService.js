import api from './api'

export function getRoutes() {
  return api.get('/routes').then((response) => response.data)
}
