import { useEffect, useState } from 'react'
import { getDrivers } from '../../services/driverService'
import { createRoute, deleteRoute, getRoutes, updateRoute } from '../../services/routeService'
import AdminLayout from './AdminLayout'
import AdminTable from './AdminTable'
import { formatDate, getApiErrorMessage, valueOrDash } from './adminUtils'

const emptyForm = { nome: '', origem: '', destino: '', driver_id: '' }

function AdminRoutesPage() {
  const [routes, setRoutes] = useState([])
  const [drivers, setDrivers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionRouteId, setActionRouteId] = useState(null)
  const [editingRoute, setEditingRoute] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let isMounted = true
    Promise.all([getRoutes(), getDrivers()])
      .then(([routeData, driverData]) => {
        if (isMounted) {
          setRoutes(routeData)
          setDrivers(driverData)
        }
      })
      .catch((apiError) => {
        if (isMounted) setError(getApiErrorMessage(apiError))
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })
    return () => { isMounted = false }
  }, [])

  const openCreateModal = () => {
    setEditingRoute(null)
    setFormData(emptyForm)
    setError('')
    setSuccess('')
    setIsModalOpen(true)
  }

  const openEditModal = (route) => {
    setEditingRoute(route)
    setFormData({
      nome: route.nome || '',
      origem: route.origem || '',
      destino: route.destino || '',
      driver_id: route.driver_id ? String(route.driver_id) : '',
    })
    setError('')
    setSuccess('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (isSaving) return
    setIsModalOpen(false)
    setEditingRoute(null)
    setFormData(emptyForm)
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isSaving) return

    const payload = {
      nome: formData.nome.trim(),
      origem: formData.origem.trim(),
      destino: formData.destino.trim(),
      driver_id: formData.driver_id ? Number(formData.driver_id) : null,
    }

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const result = editingRoute
        ? await updateRoute(editingRoute.id, payload)
        : await createRoute(payload)
      const savedRoute = result.route

      setRoutes((current) => editingRoute
        ? current.map((route) => (route.id === savedRoute.id ? savedRoute : route))
        : [savedRoute, ...current])
      setSuccess(result?.message || (editingRoute ? 'Rota actualizada com sucesso.' : 'Rota criada com sucesso.'))
      setIsModalOpen(false)
      setEditingRoute(null)
      setFormData(emptyForm)
    } catch (apiError) {
      setError(getApiErrorMessage(apiError))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (route) => {
    if (!window.confirm(`Tem certeza que deseja eliminar a rota ${route.nome}?`)) return

    setActionRouteId(route.id)
    setError('')
    setSuccess('')
    try {
      const result = await deleteRoute(route.id)
      setRoutes((current) => current.filter((item) => item.id !== route.id))
      setSuccess(result?.message || 'Rota eliminada com sucesso.')
    } catch (apiError) {
      setError(getApiErrorMessage(apiError))
    } finally {
      setActionRouteId(null)
    }
  }

  const getDriverName = (driverId) => drivers.find((driver) => Number(driver.id) === Number(driverId))?.name

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'nome', label: 'Nome', render: (route) => valueOrDash(route.nome) },
    { key: 'origem', label: 'Origem', render: (route) => valueOrDash(route.origem) },
    { key: 'destino', label: 'Destino', render: (route) => valueOrDash(route.destino) },
    {
      key: 'driver_id',
      label: 'Motorista',
      render: (route) => route.driver_id
        ? `${getDriverName(route.driver_id) || 'Motorista'} (#${route.driver_id})`
        : 'Sem motorista — rota disponível',
    },
    {
      key: 'availability',
      label: 'Estado',
      render: (route) => (
        <span className={`admin-status-badge ${route.driver_id ? 'admin-status-active' : 'admin-feedback-status-pending'}`}>
          {route.driver_id ? 'Atribuída' : 'Disponível'}
        </span>
      ),
    },
    { key: 'created_at', label: 'Criado em', render: (route) => formatDate(route.created_at) },
    {
      key: 'actions',
      label: 'Acções',
      render: (route) => {
        const isBusy = actionRouteId === route.id
        return (
          <div className="admin-table-actions">
            <button className="button button-small button-neutral" disabled={isBusy} onClick={() => openEditModal(route)} type="button">Editar</button>
            <button className="button button-small button-danger" disabled={isBusy} onClick={() => handleDelete(route)} type="button">
              {isBusy ? 'A processar...' : 'Eliminar'}
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <AdminLayout eyebrow="Operação" title="Rotas" description="Crie e faça a gestão das rotas do sistema.">
      <div className="admin-action-row">
        <div><span>Rotas registadas</span><strong>{routes.length}</strong></div>
        <button className="button button-small button-success" disabled={isLoading} onClick={openCreateModal} type="button">Adicionar Rota</button>
      </div>
      {isLoading ? <div className="admin-state">A carregar rotas...</div> : null}
      {success ? <div className="admin-success">{success}</div> : null}
      {error ? <div className="admin-error">{error}</div> : null}
      {!isLoading && (!error || routes.length > 0) ? <AdminTable columns={columns} data={routes} emptyMessage="Nenhuma rota encontrada." /> : null}

      {isModalOpen ? (
        <div className="admin-modal-backdrop" role="presentation">
          <form className="admin-route-modal" onSubmit={handleSubmit}>
            <div className="admin-modal-header">
              <div>
                <span>{editingRoute ? 'Editar rota' : 'Nova rota'}</span>
                <strong>{editingRoute ? valueOrDash(editingRoute.nome) : 'Adicionar Rota'}</strong>
              </div>
              <button aria-label="Fechar" className="admin-modal-close" disabled={isSaving} onClick={closeModal} type="button">x</button>
            </div>
            {error ? <div className="admin-error">{error}</div> : null}
            <label className="admin-field"><span>Nome</span><input disabled={isSaving} name="nome" onChange={handleInputChange} required type="text" value={formData.nome} /></label>
            <label className="admin-field"><span>Origem</span><input disabled={isSaving} name="origem" onChange={handleInputChange} required type="text" value={formData.origem} /></label>
            <label className="admin-field"><span>Destino</span><input disabled={isSaving} name="destino" onChange={handleInputChange} required type="text" value={formData.destino} /></label>
            <label className="admin-field">
              <span>Motorista</span>
              <select disabled={isSaving} name="driver_id" onChange={handleInputChange} value={formData.driver_id}>
                <option value="">Sem motorista — rota disponível</option>
                {drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name} (#{driver.id})</option>)}
              </select>
            </label>
            <div className="admin-modal-actions">
              <button className="button button-small" disabled={isSaving} onClick={closeModal} type="button">Cancelar</button>
              <button className="button button-small button-success" disabled={isSaving} type="submit">{isSaving ? 'A guardar...' : 'Guardar'}</button>
            </div>
          </form>
        </div>
      ) : null}
    </AdminLayout>
  )
}

export default AdminRoutesPage
