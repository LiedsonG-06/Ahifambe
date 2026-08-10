export const AUTH_TOKEN_KEY = 'ahifambe_token'
export const AUTH_USER_KEY = 'ahifambe_user'

export const getAuthToken = () => sessionStorage.getItem(AUTH_TOKEN_KEY)

export const getAuthUser = () => {
  try {
    return JSON.parse(sessionStorage.getItem(AUTH_USER_KEY) || 'null')
  } catch {
    sessionStorage.removeItem(AUTH_USER_KEY)
    return null
  }
}

export const saveAuthSession = (token, user) => {
  sessionStorage.setItem(AUTH_TOKEN_KEY, token)
  sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

export const saveAuthUser = (user) => {
  sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

export const clearAuthSession = () => {
  sessionStorage.removeItem(AUTH_TOKEN_KEY)
  sessionStorage.removeItem(AUTH_USER_KEY)
}

export const clearLegacySharedAuth = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
}
