import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

function getDashboardPath(role) {
  const dashboards = {
    admin: '/admin',
    driver: '/driver',
    passenger: '/passenger',
  }

  return dashboards[role] || '/login'
}

function getLoginPayload(data) {
  return {
    token: data.token || data.accessToken || data.access_token,
    user: data.user || data.utilizador || data.data?.user,
  }
}

function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated, login, user } = useAuth()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isBlockedAccount = error === 'A sua conta foi bloqueada. Contacte o administrador do sistema.'

  if (isAuthenticated) {
    return <Navigate to={getDashboardPath(user.role)} replace />
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await api.post('/auth/login', formData)
      const { token, user: authUser } = getLoginPayload(response.data)

      if (!token || !authUser?.role) {
        throw new Error('Resposta de autenticacao invalida.')
      }

      login(token, authUser)
      navigate(getDashboardPath(authUser.role), { replace: true })
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          'Nao foi possivel iniciar sessao.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <Link className="brand auth-brand" to="/">
          Lili Transport
        </Link>
        <h1>Entrar</h1>
        <p>Acede ao painel conforme o teu perfil.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            autoComplete="current-password"
            required
          />

          {error && (
            <div className={isBlockedAccount ? 'form-error form-error-blocked' : 'form-error'}>
              {isBlockedAccount ? (
                <>
                  <strong>Conta bloqueada</strong>
                  <span>Contacte o administrador do sistema.</span>
                </>
              ) : (
                error
              )}
            </div>
          )}

          <button className="button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'A entrar...' : 'Login'}
          </button>
        </form>

        <p className="auth-footer">
          Ainda nao tens conta? <Link to="/register">Criar conta</Link>
        </p>
      </section>
    </main>
  )
}

export default LoginPage
