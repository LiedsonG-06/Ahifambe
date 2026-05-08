export function getApiErrorMessage(error) {
  return error?.response?.data?.message || error.message || 'Nao foi possivel carregar os dados.'
}

export function formatDate(value) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('pt-MZ', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function valueOrDash(value) {
  return value ?? '-'
}
