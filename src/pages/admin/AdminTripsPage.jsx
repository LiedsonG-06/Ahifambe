import { useCallback, useEffect, useRef, useState } from 'react'
import { getDrivers } from '../../services/driverService'
import { getRoutes } from '../../services/routeService'
import { getAdminTrip, getAdminTrips } from '../../services/tripService'
import { getVehicles } from '../../services/vehicleService'
import AdminLayout from './AdminLayout'
import AdminTable from './AdminTable'
import { formatDate, getApiErrorMessage } from './adminUtils'

const initialFilters = { status: '', driver_id: '', route_id: '', vehicle_id: '', date_from: '', date_to: '', search: '' }
const statusLabels = { scheduled: 'Agendada', in_progress: 'Em curso', completed: 'Concluída (legado)', finished: 'Terminada', cancelled: 'Cancelada' }
const occupancyLabels = { vazio: 'Vazio', intermedio: 'Intermédio', lotado: 'Lotado' }

function locationState(trip) {
  if (!trip.latest_location_at) return { label: 'Sem localização', kind: 'missing' }
  const age = Date.now() - new Date(trip.latest_location_at).getTime()
  return age <= 2 * 60 * 1000 ? { label: 'Actualizada', kind: 'fresh' } : { label: 'Localização antiga', kind: 'stale' }
}

function AdminTripsPage() {
  const [filters, setFilters] = useState(initialFilters)
  const [applied, setApplied] = useState(initialFilters)
  const [trips, setTrips] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, total_pages: 0 })
  const [options, setOptions] = useState({ drivers: [], routes: [], vehicles: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const requestActive = useRef(false)

  const loadTrips = useCallback(async (page = 1, quiet = false) => {
    if (requestActive.current) return
    requestActive.current = true
    if (!quiet) setLoading(true)
    setError('')
    try {
      const params = { ...applied, page, limit: 20 }
      Object.keys(params).forEach((key) => { if (params[key] === '') delete params[key] })
      const result = await getAdminTrips(params)
      setTrips(result.trips || [])
      setPagination(result.pagination || { page, limit: 20, total: 0, total_pages: 0 })

    } catch (err) { setError(getApiErrorMessage(err)) } finally { requestActive.current = false; if (!quiet) setLoading(false) }
  }, [applied])

  useEffect(() => { const timer = window.setTimeout(() => loadTrips(1), 0); return () => window.clearTimeout(timer) }, [loadTrips])
  useEffect(() => { let mounted = true; Promise.all([getDrivers(), getRoutes(), getVehicles()]).then(([drivers, routes, vehicles]) => { if (mounted) setOptions({ drivers, routes, vehicles }) }).catch((err) => { if (mounted) setError(getApiErrorMessage(err)) }); return () => { mounted = false } }, [])
  useEffect(() => {
    if (!trips.some((trip) => trip.status === 'in_progress')) return undefined
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') loadTrips(pagination.page, true) }, 30000)
    return () => window.clearInterval(timer)
  }, [trips, pagination.page, loadTrips])

  const applyFilters = (event) => { event.preventDefault(); setApplied({ ...filters }) }
  const clearFilters = () => { setFilters(initialFilters); setApplied(initialFilters) }
  const openDetails = async (trip) => { setDetailLoading(true); setError(''); try { setDetail(await getAdminTrip(trip.id)) } catch (err) { setError(getApiErrorMessage(err)) } finally { setDetailLoading(false) } }
  const columns = [
    { key: 'id', label: 'ID', render: (trip) => `#${trip.id}` },
    { key: 'route', label: 'Rota', render: (trip) => <><strong>{trip.route_nome}</strong><br /><small>{trip.origem} → {trip.destino}</small></> },
    { key: 'driver', label: 'Motorista', render: (trip) => trip.driver_name || 'Sem motorista' },
    { key: 'vehicle', label: 'Viatura', render: (trip) => trip.plate_number ? <>{trip.plate_number}<br /><small>{trip.model || '-'}</small></> : 'Sem viatura' },
    { key: 'lotacao', label: 'Lotação', render: (trip) => occupancyLabels[trip.lotacao] || trip.lotacao },
    { key: 'status', label: 'Estado', render: (trip) => <span className={`admin-status-badge ${trip.status === 'in_progress' ? 'admin-status-active' : 'admin-status-blocked'}`}>{statusLabels[trip.status] || trip.status}</span> },
    { key: 'departure', label: 'Partida', render: (trip) => formatDate(trip.departure_time) },
    { key: 'arrival', label: 'Chegada', render: (trip) => formatDate(trip.arrival_time) },
    { key: 'location', label: 'Localização', render: (trip) => { const state = locationState(trip); return <span title={trip.latest_location_at ? formatDate(trip.latest_location_at) : ''}>{state.label}{trip.latest_location_at ? <><br /><small>{formatDate(trip.latest_location_at)}</small></> : null}</span> } },
    { key: 'actions', label: 'Acções', render: (trip) => <button className="button button-small button-neutral" disabled={detailLoading} onClick={() => openDetails(trip)} type="button">Detalhes</button> },
  ]

  return <AdminLayout eyebrow="Operação" title="Viagens" description="Consulte e acompanhe as viagens sem alterar o histórico operacional.">
    <form className="admin-trip-filters" onSubmit={applyFilters}>
      <label className="admin-field"><span>Pesquisa</span><input name="search" onChange={(e) => setFilters((v) => ({ ...v, search: e.target.value }))} placeholder="Matrícula, motorista ou rota" value={filters.search} /></label>
      <label className="admin-field"><span>Estado</span><select onChange={(e) => setFilters((v) => ({ ...v, status: e.target.value }))} value={filters.status}><option value="">Todos</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="admin-field"><span>Motorista</span><select onChange={(e) => setFilters((v) => ({ ...v, driver_id: e.target.value }))} value={filters.driver_id}><option value="">Todos</option>{options.drivers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="admin-field"><span>Rota</span><select onChange={(e) => setFilters((v) => ({ ...v, route_id: e.target.value }))} value={filters.route_id}><option value="">Todas</option>{options.routes.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
      <label className="admin-field"><span>Viatura</span><select onChange={(e) => setFilters((v) => ({ ...v, vehicle_id: e.target.value }))} value={filters.vehicle_id}><option value="">Todas</option>{options.vehicles.map((item) => <option key={item.id} value={item.id}>{item.plate_number}</option>)}</select></label>
      <label className="admin-field"><span>De</span><input onChange={(e) => setFilters((v) => ({ ...v, date_from: e.target.value }))} type="date" value={filters.date_from} /></label>
      <label className="admin-field"><span>Até</span><input onChange={(e) => setFilters((v) => ({ ...v, date_to: e.target.value }))} type="date" value={filters.date_to} /></label>
      <div className="admin-modal-actions"><button className="button button-small button-neutral" onClick={clearFilters} type="button">Limpar filtros</button><button className="button button-small" disabled={loading} type="submit">Aplicar</button></div>
    </form>
    <div className="admin-action-row"><div><span>Resultados</span><strong>{pagination.total}</strong></div><small>Viagens activas actualizadas a cada 30 segundos</small></div>
    {loading ? <div className="admin-state">A carregar viagens...</div> : null}
    {error ? <div className="admin-error">{error}</div> : null}
    {!loading ? <AdminTable columns={columns} data={trips} emptyMessage="Nenhuma viagem corresponde aos filtros." /> : null}
    {pagination.total_pages > 1 ? <div className="admin-pagination"><button className="button button-small button-neutral" disabled={loading || pagination.page <= 1} onClick={() => loadTrips(pagination.page - 1)} type="button">Anterior</button><span>Página {pagination.page} de {pagination.total_pages}</span><button className="button button-small button-neutral" disabled={loading || pagination.page >= pagination.total_pages} onClick={() => loadTrips(pagination.page + 1)} type="button">Seguinte</button></div> : null}
    {detail ? <div className="admin-modal-backdrop" role="presentation"><section className="admin-route-modal" aria-labelledby="trip-detail-title" role="dialog"><div className="admin-modal-header"><div><span>Detalhes da viagem</span><strong id="trip-detail-title">Viagem #{detail.id}</strong></div><button aria-label="Fechar" className="admin-modal-close" onClick={() => setDetail(null)} type="button">×</button></div><div className="admin-trip-detail-grid"><p><span>Estado</span><strong>{statusLabels[detail.status] || detail.status}</strong></p><p><span>Lotação</span><strong>{occupancyLabels[detail.lotacao] || detail.lotacao}</strong></p><p><span>Rota</span><strong>{detail.route_nome}</strong><small>{detail.origem} → {detail.destino}</small></p><p><span>Motorista</span><strong>{detail.driver_name || 'Sem motorista'}</strong></p><p><span>Viatura</span><strong>{detail.plate_number || 'Sem viatura'}</strong><small>{detail.model || '-'} · capacidade {detail.capacity ?? '-'}</small></p><p><span>Partida</span><strong>{formatDate(detail.departure_time)}</strong></p><p><span>Chegada</span><strong>{formatDate(detail.arrival_time)}</strong></p><p><span>Última localização</span><strong>{locationState(detail).label}</strong><small>{detail.latest_location_at ? `${detail.latest_latitude}, ${detail.latest_longitude} · ${formatDate(detail.latest_location_at)}` : 'Nenhuma posição registada'}</small></p></div><div className="admin-modal-actions"><button className="button button-small" onClick={() => setDetail(null)} type="button">Fechar</button></div></section></div> : null}
  </AdminLayout>
}
export default AdminTripsPage