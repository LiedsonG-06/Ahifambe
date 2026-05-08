import { useEffect, useState } from 'react'
import { getFeedback } from '../../services/feedbackService'
import AdminLayout from './AdminLayout'
import AdminTable from './AdminTable'
import { formatDate, getApiErrorMessage, valueOrDash } from './adminUtils'

const columns = [
  {
    key: 'passenger_name',
    label: 'Passageiro',
    render: (feedback) => valueOrDash(feedback.passenger_name),
  },
  {
    key: 'driver_name',
    label: 'Motorista',
    render: (feedback) => valueOrDash(feedback.driver_name),
  },
  { key: 'route_nome', label: 'Rota', render: (feedback) => valueOrDash(feedback.route_nome) },
  { key: 'rating', label: 'Rating', render: (feedback) => valueOrDash(feedback.rating) },
  { key: 'comment', label: 'Comentario', render: (feedback) => valueOrDash(feedback.comment) },
  { key: 'created_at', label: 'Data', render: (feedback) => formatDate(feedback.created_at) },
]

function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

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

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <AdminLayout
      eyebrow="Qualidade"
      title="Feedback"
      description="Lista carregada de GET /api/feedback."
    >
      {isLoading ? <div className="admin-state">A carregar feedback...</div> : null}
      {error ? <div className="admin-error">{error}</div> : null}
      {!isLoading && !error ? (
        <AdminTable columns={columns} data={feedback} emptyMessage="Nenhum feedback encontrado." />
      ) : null}
    </AdminLayout>
  )
}

export default AdminFeedbackPage
