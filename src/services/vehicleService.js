import api from './api'

export function getVehicles() {
  return api.get('/vehicles').then((response) => {
    console.log('GET /api/vehicles response:', response.data)
    return Array.isArray(response.data) ? response.data : response.data?.vehicles || []
  })
}

export function createVehicle(vehicleData) {
  return api.post('/vehicles', vehicleData).then((response) => response.data)
}

export function updateVehicleStatus(vehicleId, status) {
  return api.patch(`/vehicles/${vehicleId}/status`, { status }).then((response) => response.data)
}
