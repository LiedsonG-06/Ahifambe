import api from './api'

export function getRoutes() {
  return api.get('/routes').then((response) => {
    return Array.isArray(response.data) ? response.data : response.data?.routes || []
  })
}

export function createRoute(routeData) {
  return api.post('/routes', routeData).then((response) => response.data)
}

export function updateRoute(routeId, routeData) {
  return api.put(`/routes/${routeId}`, routeData).then((response) => response.data)
}

export function deleteRoute(routeId) {
  return api.delete(`/routes/${routeId}`).then((response) => response.data)
}
