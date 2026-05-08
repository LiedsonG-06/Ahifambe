import api from './api'

export function getFeedback() {
  return api.get('/feedback').then((response) => response.data)
}
