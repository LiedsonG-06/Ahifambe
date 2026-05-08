import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'

function RegisterPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'passenger',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await api.post('/auth/register', formData)
      navigate('/login', { replace: true })
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Nao foi possivel criar a conta.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <Link className="brand auth-brand" to="/">
          Ahifambe
        </Link>
        <h1>Criar conta</h1>
        <p>Regista-te como passageiro ou motorista.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="name">Nome</label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            autoComplete="name"
            required
          />

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
            autoComplete="new-password"
            required
            minLength="6"
          />

          <label htmlFor="role">Tipo de conta</label>
          <select id="role" name="role" value={formData.role} onChange={handleChange}>
            <option value="passenger">Passageiro</option>
            <option value="driver">Motorista</option>
          </select>

          {error && <p className="form-error">{error}</p>}

          <button className="button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'A criar...' : 'Criar Conta'}
          </button>
        </form>

        <p className="auth-footer">
          Ja tens conta? <Link to="/login">Entrar</Link>
        </p>
      </section>
    </main>
  )
}

export default RegisterPage
