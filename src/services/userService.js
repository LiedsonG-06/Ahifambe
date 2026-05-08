import api from './api'

export function getUsers() {
  return api.get('/users').then((response) => response.data)
}

export function blockUser(id) {
  return api.patch(`/users/${id}/block`).then((response) => response.data)
}

export function unblockUser(id) {
  return api.patch(`/users/${id}/unblock`).then((response) => response.data)
}

export function deleteUser(id) {
  return api.delete(`/users/${id}`).then((response) => response.data)
}
