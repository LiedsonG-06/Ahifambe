import { useEffect, useState } from 'react'
import { getFeedback, updateFeedbackStatus } from '../../services/feedbackService'
import { getRoutes } from '../../services/routeService'
import { getUsers } from '../../services/userService'
import AdminLayout from './AdminLayout'
import AdminTable from './AdminTable'
import { formatDate, getApiErrorMessage, valueOrDash } from './adminUtils'

const FEEDBACK_STATUS_LABELS = {
  pending: 'pendente',
  reviewed: 'analisado',
  resolved: 'resolvido',
}

const FEEDBACK_TYPE_LABELS = {
  reclamacao: 'reclamacao',
  sugestao: 'sugestao',
  elogio: 'elogio',
  problema_operacional: 'problema operacional',
}

function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    passengers: 0,
    drivers: 0,
    routes: 0,
    feedback: 0,
  })
  const [feedbackItems, setFeedbackItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingFeedbackId, setUpdatingFeedbackId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadStats() {
      try {
        setIsLoading(true)
        setError('')

        const [users, routes, feedback] = await Promise.all([
          getUsers(),
          getRoutes(),
          getFeedback(),
        ])

        if (isMounted) {
          const passengerCount = users.filter((user) => user.role === 'passenger').length
          const driverCount = users.filter((user) => user.role === 'driver').length

          setStats({
            users: users.length,
            passengers: passengerCount,
            drivers: driverCount,
            routes: routes.length,
            feedback: feedback.length,
          })
          setFeedbackItems(feedback)
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

  async function handleUpdateFeedbackStatus(feedbackId, status) {
    setError('')
    setSuccess('')
    setUpdatingFeedbackId(String(feedbackId))

    try {
      const result = await updateFeedbackStatus(feedbackId, status)
      setFeedbackItems((currentFeedback) =>
        currentFeedback.map((item) => (item.id === feedbackId ? { ...item, status } : item)),
      )
      setSuccess(result?.message || 'Estado do feedback actualizado.')
    } catch (apiError) {
      setError(getApiErrorMessage(apiError))
    } finally {
      setUpdatingFeedbackId('')
    }
  }

  const feedbackColumns = [
    {
      key: 'sender_name',
      label: 'Remetente',
      render: (item) => valueOrDash(item.sender_name || item.passenger_name || item.driver_name),
    },
    { key: 'role', label: 'Role', render: (item) => valueOrDash(item.role) },
    {
      key: 'type',
      label: 'Tipo',
      render: (item) => valueOrDash(FEEDBACK_TYPE_LABELS[item.type] || item.type),
    },
    { key: 'message', label: 'Mensagem', render: (item) => valueOrDash(item.message || item.comment) },
    { key: 'created_at', label: 'Data', render: (item) => formatDate(item.created_at) },
    {
      key: 'status',
      label: 'Estado',
      render: (item) => (
        <span className={`admin-status-badge admin-feedback-status-${item.status || 'pending'}`}>
          {FEEDBACK_STATUS_LABELS[item.status] || item.status || 'pendente'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Accoes',
      render: (item) => (
        <div className="admin-table-actions">
          <button
            className="button button-neutral"
            disabled={updatingFeedbackId === String(item.id) || item.status === 'reviewed'}
            onClick={() => handleUpdateFeedbackStatus(item.id, 'reviewed')}
            type="button"
          >
            Marcar como analisado
          </button>
          <button
            className="button button-success"
            disabled={updatingFeedbackId === String(item.id) || item.status === 'resolved'}
            onClick={() => handleUpdateFeedbackStatus(item.id, 'resolved')}
            type="button"
          >
            Marcar como resolvido
          </button>
        </div>
      ),
    },
  ]

  return (
    <AdminLayout
      eyebrow="Painel de administracao"
      title="Visao Geral"
      description="Resumo operacional com dados carregados do backend."
    >
      {isLoading ? <div className="admin-state">A carregar dados...</div> : null}
      {error ? <div className="admin-error">{error}</div> : null}
      {success ? <div className="admin-success">{success}</div> : null}

      {!isLoading && !error ? (
        <>
          <div className="admin-stats">
            <article className="admin-stat-card">
              <span>Total de utilizadores</span>
              <strong>{stats.users}</strong>
            </article>
            <article className="admin-stat-card">
              <span>Total de passageiros</span>
              <strong>{stats.passengers}</strong>
            </article>
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

          <section className="admin-feedback-section">
            <div className="admin-action-row">
              <div>
                <span>Feedback recebido</span>
                <strong>{feedbackItems.length}</strong>
              </div>
            </div>
            <AdminTable columns={feedbackColumns} data={feedbackItems} emptyMessage="Nenhum feedback encontrado." />
          </section>
        </>
      ) : null}
    </AdminLayout>
  )
}

export default AdminDashboard
