import api from './api'

export function getRoutes() {
  return api.get('/routes').then((response) => {
    return Array.isArray(response.data) ? response.data : response.data?.routes || []
  })
}

export function createRoute(routeData) {
  return api.post('/routes', routeData).then((response) => response.data)
}
