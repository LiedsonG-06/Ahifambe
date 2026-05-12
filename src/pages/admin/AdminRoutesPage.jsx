import { useCallback, useEffect, useState } from 'react'
import { deleteRoute, getRoutes, updateRoute } from '../../services/routeService'
import AdminLayout from './AdminLayout'
import AdminTable from './AdminTable'
import { formatDate, getApiErrorMessage, valueOrDash } from './adminUtils'

const emptyForm = {
  nome: '',
  origem: '',
  destino: '',
}

function AdminRoutesPage() {
  const [routes, setRoutes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionRouteId, setActionRouteId] = useState(null)
  const [editingRoute, setEditingRoute] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadRoutes = useCallback((shouldUpdate = () => true) => {
    setIsLoading(true)
    setError('')

    return getRoutes()
      .then((data) => {
        if (shouldUpdate()) {
          setRoutes(data)
        }
      })
      .catch((apiError) => {
        if (shouldUpdate()) {
          setError(getApiErrorMessage(apiError))
        }
      })
      .finally(() => {
        if (shouldUpdate()) {
          setIsLoading(false)
        }
      })
  }, [])

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

  const handleEdit = (route) => {
    setEditingRoute(route)
    setFormData({
      nome: route.nome || '',
      origem: route.origem || '',
      destino: route.destino || '',
    })
    setError('')
    setSuccess('')
  }

  const handleCloseModal = () => {
    if (isSaving) {
      return
    }

    setEditingRoute(null)
    setFormData(emptyForm)
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!editingRoute) {
      return
    }

    setIsSaving(true)
    setActionRouteId(editingRoute.id)
    setError('')
    setSuccess('')

    updateRoute(editingRoute.id, formData)
      .then((result) => {
        setSuccess(result?.message || 'Rota actualizada com sucesso.')
        setEditingRoute(null)
        setFormData(emptyForm)
        return loadRoutes()
      })
      .catch((apiError) => {
        setError(getApiErrorMessage(apiError))
      })
      .finally(() => {
        setIsSaving(false)
        setActionRouteId(null)
      })
  }

  const handleDelete = (route) => {
    const confirmed = window.confirm('Tem certeza que deseja eliminar esta rota?')

    if (!confirmed) {
      return
    }

    setActionRouteId(route.id)
    setError('')
    setSuccess('')

    deleteRoute(route.id)
      .then((result) => {
        setSuccess(result?.message || 'Rota eliminada com sucesso.')
        return loadRoutes()
      })
      .catch((apiError) => {
        setError(getApiErrorMessage(apiError))
      })
      .finally(() => {
        setActionRouteId(null)
      })
  }

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'nome', label: 'Nome', render: (route) => valueOrDash(route.nome) },
    { key: 'origem', label: 'Origem', render: (route) => valueOrDash(route.origem) },
    { key: 'destino', label: 'Destino', render: (route) => valueOrDash(route.destino) },
    { key: 'created_at', label: 'Criado em', render: (route) => formatDate(route.created_at) },
    {
      key: 'actions',
      label: 'Accoes',
      render: (route) => {
        const isBusy = actionRouteId === route.id

        return (
          <div className="admin-table-actions">
            <button
              className="button button-small button-neutral"
              disabled={isBusy}
              onClick={() => handleEdit(route)}
              type="button"
            >
              Editar
            </button>
            <button
              className="button button-small button-danger"
              disabled={isBusy}
              onClick={() => handleDelete(route)}
              type="button"
            >
              {isBusy ? 'A processar...' : 'Eliminar'}
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <AdminLayout eyebrow="Operacao" title="Rotas" description="Lista carregada de GET /api/routes.">
      {isLoading ? <div className="admin-state">A carregar rotas...</div> : null}
      {success ? <div className="admin-success">{success}</div> : null}
      {error ? <div className="admin-error">{error}</div> : null}
      {!isLoading && (!error || routes.length > 0) ? (
        <AdminTable columns={columns} data={routes} emptyMessage="Nenhuma rota encontrada." />
      ) : null}
      {editingRoute ? (
        <div className="admin-modal-backdrop" role="presentation">
          <form className="admin-route-modal" onSubmit={handleSubmit}>
            <div className="admin-modal-header">
              <div>
                <span>Editar rota</span>
                <strong>{valueOrDash(editingRoute.nome)}</strong>
              </div>
              <button
                aria-label="Fechar"
                className="admin-modal-close"
                disabled={isSaving}
                onClick={handleCloseModal}
                type="button"
              >
                x
              </button>
            </div>
            <label className="admin-field">
              <span>Nome</span>
              <input
                disabled={isSaving}
                name="nome"
                onChange={handleInputChange}
                required
                type="text"
                value={formData.nome}
              />
            </label>
            <label className="admin-field">
              <span>Origem</span>
              <input
                disabled={isSaving}
                name="origem"
                onChange={handleInputChange}
                required
                type="text"
                value={formData.origem}
              />
            </label>
            <label className="admin-field">
              <span>Destino</span>
              <input
                disabled={isSaving}
                name="destino"
                onChange={handleInputChange}
                required
                type="text"
                value={formData.destino}
              />
            </label>
            <div className="admin-modal-actions">
              <button
                className="button button-small"
                disabled={isSaving}
                onClick={handleCloseModal}
                type="button"
              >
                Cancelar
              </button>
              <button className="button button-small button-success" disabled={isSaving} type="submit">
                {isSaving ? 'A guardar...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </AdminLayout>
  )
}

export default AdminRoutesPage
