import { useEffect, useState } from 'react'
import { getFeedback, updateFeedbackStatus } from '../../services/feedbackService'
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

function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingFeedbackId, setUpdatingFeedbackId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let isMounted = true

    const timeoutId = window.setTimeout(() => {
      setIsLoading(true)
      setError('')

      getFeedback()
        .then((data) => {
          if (isMounted) {
            setFeedback(data)
          }
        })
        .catch((apiError) => {
          if (isMounted) {
            setError(getApiErrorMessage(apiError))
          }
        })
        .finally(() => {
          if (isMounted) {
            setIsLoading(false)
          }
        })
    }, 0)

    return () => {
      isMounted = false
      window.clearTimeout(timeoutId)
    }
  }, [])

  async function handleUpdateStatus(feedbackId, status) {
    setError('')
    setSuccess('')
    setUpdatingFeedbackId(String(feedbackId))

    try {
      const result = await updateFeedbackStatus(feedbackId, status)
      setFeedback((currentFeedback) =>
        currentFeedback.map((item) => (item.id === feedbackId ? { ...item, status } : item)),
      )
      setSuccess(result?.message || 'Estado do feedback actualizado.')
    } catch (apiError) {
      setError(getApiErrorMessage(apiError))
    } finally {
      setUpdatingFeedbackId('')
    }
  }

  const columns = [
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
    { key: 'trip_id', label: 'Viagem', render: (item) => (item.trip_id ? `#${item.trip_id}` : '-') },
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
            onClick={() => handleUpdateStatus(item.id, 'reviewed')}
            type="button"
          >
            Marcar como analisado
          </button>
          <button
            className="button button-success"
            disabled={updatingFeedbackId === String(item.id) || item.status === 'resolved'}
            onClick={() => handleUpdateStatus(item.id, 'resolved')}
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
      eyebrow="Qualidade"
      title="Feedback"
      description="Lista carregada de GET /api/feedback."
    >
      {isLoading ? <div className="admin-state">A carregar feedback...</div> : null}
      {error ? <div className="admin-error">{error}</div> : null}
      {success ? <div className="admin-success">{success}</div> : null}
      {!isLoading && !error ? (
        <AdminTable columns={columns} data={feedback} emptyMessage="Nenhum feedback encontrado." />
      ) : null}
    </AdminLayout>
  )
}

export default AdminFeedbackPage
