import { useEffect, useState } from 'react'
import { getDrivers } from '../../services/driverService'
import { getFeedback } from '../../services/feedbackService'
import { getRoutes } from '../../services/routeService'
import AdminLayout from './AdminLayout'
import { getApiErrorMessage } from './adminUtils'

function AdminDashboard() {
  const [stats, setStats] = useState({
    drivers: 0,
    routes: 0,
    feedback: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadStats() {
      try {
        setIsLoading(true)
        setError('')

        const [drivers, routes, feedback] = await Promise.all([
          getDrivers(),
          getRoutes(),
          getFeedback(),
        ])

        if (isMounted) {
          setStats({
            drivers: drivers.length,
            routes: routes.length,
            feedback: feedback.length,
          })
        }
      } catch (apiError) {
        if (isMounted) {
          setError(getApiErrorMessage(apiError))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadStats()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <AdminLayout
      eyebrow="Painel de administracao"
      title="Visao Geral"
      description="Resumo operacional com dados carregados do backend."
    >
      {isLoading ? <div className="admin-state">A carregar dados...</div> : null}
      {error ? <div className="admin-error">{error}</div> : null}

      {!isLoading && !error ? (
        <div className="admin-stats">
          <article className="admin-stat-card">
            <span>Total de motoristas</span>
            <strong>{stats.drivers}</strong>
          </article>
          <article className="admin-stat-card">
            <span>Total de rotas</span>
            <strong>{stats.routes}</strong>
          </article>
          <article className="admin-stat-card">
            <span>Total de feedbacks</span>
            <strong>{stats.feedback}</strong>
          </article>
        </div>
      ) : null}
    </AdminLayout>
  )
}

export default AdminDashboard
