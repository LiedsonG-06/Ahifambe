import { beforeEach, describe, expect, it } from 'vitest'
import api from '../services/api'

describe('API authentication per tab', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('sends the token stored in the current tab session', async () => {
    localStorage.setItem('ahifambe_token', 'shared-admin-token')
    sessionStorage.setItem('ahifambe_token', 'current-tab-driver-token')

    const response = await api.get('/probe', {
      adapter: (config) =>
        Promise.resolve({ data: null, status: 200, statusText: 'OK', headers: {}, config }),
    })

    expect(response.config.headers.Authorization).toBe('Bearer current-tab-driver-token')
  })

  it('does not send a token that exists only in shared localStorage', async () => {
    localStorage.setItem('ahifambe_token', 'shared-admin-token')

    const response = await api.get('/probe', {
      adapter: (config) =>
        Promise.resolve({ data: null, status: 200, statusText: 'OK', headers: {}, config }),
    })

    expect(response.config.headers.Authorization).toBeUndefined()
  })
})
