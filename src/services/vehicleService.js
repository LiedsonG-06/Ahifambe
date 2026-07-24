import api from './api'

export function getVehicles() {
  return api.get('/vehicles').then((response) => {
    return Array.isArray(response.data) ? response.data : response.data?.vehicles || []
  })
}

export function createVehicle(vehicleData) {
  return api.post('/vehicles', vehicleData).then((response) => response.data)
}

export function updateVehicleStatus(vehicleId, status) {
  return api.patch(`/vehicles/${vehicleId}/status`, { status }).then((response) => response.data)
}
export function updateVehicle(vehicleId, vehicleData) {
  return api.put(`/vehicles/${vehicleId}`, vehicleData).then((response) => response.data)
}

export function deleteVehicle(vehicleId) {
  return api.delete(`/vehicles/${vehicleId}`).then((response) => response.data)
}
