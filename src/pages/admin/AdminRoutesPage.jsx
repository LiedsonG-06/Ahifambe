import { useEffect, useState } from 'react'
import { getRoutes } from '../../services/routeService'
import AdminLayout from './AdminLayout'
import AdminTable from './AdminTable'
import { formatDate, getApiErrorMessage, valueOrDash } from './adminUtils'

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'nome', label: 'Nome', render: (route) => valueOrDash(route.nome) },
  { key: 'origem', label: 'Origem', render: (route) => valueOrDash(route.origem) },
  { key: 'destino', label: 'Destino', render: (route) => valueOrDash(route.destino) },
  { key: 'created_at', label: 'Criado em', render: (route) => formatDate(route.created_at) },
]

function AdminRoutesPage() {
  const [routes, setRoutes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    getRoutes()
      .then((data) => {
        if (isMounted) {
          setRoutes(data)
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
    <AdminLayout eyebrow="Operacao" title="Rotas" description="Lista carregada de GET /api/routes.">
      {isLoading ? <div className="admin-state">A carregar rotas...</div> : null}
      {error ? <div className="admin-error">{error}</div> : null}
      {!isLoading && !error ? (
        <AdminTable columns={columns} data={routes} emptyMessage="Nenhuma rota encontrada." />
      ) : null}
    </AdminLayout>
  )
}

export default AdminRoutesPage
