import { useEffect, useState } from 'react'
import { getDrivers } from '../../services/driverService'
import { getVehicles, updateVehicle, updateVehicleStatus } from '../../services/vehicleService'
import AdminLayout from './AdminLayout'
import AdminTable from './AdminTable'
import { formatDate, getApiErrorMessage } from './adminUtils'

const emptyForm = { plate_number: '', model: '', capacity: '', status: 'active', driver_id: '' }
const labels = { active: 'Activa', inactive: 'Inactiva', maintenance: 'Em manutenção' }

function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState([]), [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true), [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null), [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false), [actionId, setActionId] = useState(null)
  const [error, setError] = useState(''), [success, setSuccess] = useState('')

  useEffect(() => { let mounted = true; Promise.all([getVehicles(), getDrivers()]).then(([v, d]) => { if (mounted) { setVehicles(v); setDrivers(d) } }).catch((e) => { if (mounted) setError(getApiErrorMessage(e)) }).finally(() => { if (mounted) setLoading(false) }); return () => { mounted = false } }, [])
  const openEdit = (v) => { if (v.has_active_trip) { setError('A viatura não pode ser editada durante uma viagem activa.'); return }; setEditing(v); setForm({ plate_number: v.plate_number, model: v.model || '', capacity: String(v.capacity), status: v.status, driver_id: v.driver_id ? String(v.driver_id) : '' }); setError(''); setSuccess(''); setModal(true) }
  const close = () => { if (!saving) { setModal(false); setEditing(null); setForm(emptyForm) } }
  const change = (e) => { const { name, value } = e.target; setForm((f) => ({ ...f, [name]: value })) }
  const submit = async (e) => { e.preventDefault(); if (saving) return; const payload = { plate_number: form.plate_number.trim(), model: form.model.trim(), capacity: Number(form.capacity), status: form.status, driver_id: form.driver_id ? Number(form.driver_id) : null }; setSaving(true); setError(''); setSuccess(''); try { const result = await updateVehicle(editing.id, payload); setVehicles((items) => items.map((v) => v.id === result.vehicle.id ? result.vehicle : v)); setSuccess(result.message); setModal(false); setEditing(null); setForm(emptyForm) } catch (err) { setError(getApiErrorMessage(err)) } finally { setSaving(false) } }
  const toggle = async (v) => { const next = v.status === 'active' ? 'inactive' : 'active'; if (v.has_active_trip && next !== 'active') { setError('A viatura não pode ser desactivada durante uma viagem activa.'); return }; setActionId(v.id); setError(''); setSuccess(''); try { const result = await updateVehicleStatus(v.id, next); setVehicles((items) => items.map((x) => x.id === v.id ? result.vehicle : x)); setSuccess(result.message) } catch (err) { setError(getApiErrorMessage(err)) } finally { setActionId(null) } }

  const driverName = (id) => drivers.find((d) => Number(d.id) === Number(id))?.name
  const columns = [
    { key: 'plate_number', label: 'Matrícula' }, { key: 'model', label: 'Modelo' }, { key: 'capacity', label: 'Capacidade' },
    { key: 'status', label: 'Estado', render: (v) => <span className={`admin-status-badge ${v.status === 'active' ? 'admin-status-active' : 'admin-status-blocked'}`}>{labels[v.status] || v.status}</span> },
    { key: 'driver', label: 'Motorista', render: (v) => v.driver_id ? `${driverName(v.driver_id) || 'Motorista'} (#${v.driver_id})` : 'Sem motorista' },
    { key: 'operation', label: 'Situação', render: (v) => v.has_active_trip ? 'Em viagem' : 'Disponível' },
    { key: 'created_at', label: 'Criada em', render: (v) => formatDate(v.created_at) },
    { key: 'actions', label: 'Acções', render: (v) => <div className="admin-table-actions"><button className="button button-small button-neutral" disabled={actionId === v.id || Boolean(v.has_active_trip)} onClick={() => openEdit(v)} type="button">Editar</button><button className="button button-small" disabled={actionId === v.id || Boolean(v.has_active_trip)} onClick={() => toggle(v)} type="button">{v.status === 'active' ? 'Desactivar' : 'Activar'}</button></div> },
  ]
  return <AdminLayout eyebrow="Operação" title="Viaturas" description="Consulte e actualize as viaturas registadas pelos motoristas."><div className="admin-action-row"><div><span>Viaturas registadas</span><strong>{vehicles.length}</strong></div></div>{loading ? <div className="admin-state">A carregar viaturas...</div> : null}{success ? <div className="admin-success">{success}</div> : null}{error ? <div className="admin-error">{error}</div> : null}{!loading && (!error || vehicles.length) ? <AdminTable columns={columns} data={vehicles} emptyMessage="Nenhuma viatura encontrada." /> : null}{modal ? <div className="admin-modal-backdrop" role="presentation"><form className="admin-route-modal" onSubmit={submit}><div className="admin-modal-header"><div><span>Editar viatura</span><strong>{editing?.plate_number}</strong></div><button aria-label="Fechar" className="admin-modal-close" disabled={saving} onClick={close} type="button">x</button></div>{error ? <div className="admin-error">{error}</div> : null}<label className="admin-field"><span>Matrícula</span><input disabled={saving} name="plate_number" onChange={change} required value={form.plate_number} /></label><label className="admin-field"><span>Marca/modelo</span><input disabled={saving} name="model" onChange={change} required value={form.model} /></label><label className="admin-field"><span>Capacidade</span><input disabled={saving} min="1" name="capacity" onChange={change} required type="number" value={form.capacity} /></label><label className="admin-field"><span>Estado</span><select disabled={saving} name="status" onChange={change} value={form.status}><option value="active">Activa</option><option value="inactive">Inactiva</option><option value="maintenance">Em manutenção</option></select></label><label className="admin-field"><span>Motorista</span><select disabled={saving} name="driver_id" onChange={change} value={form.driver_id}><option value="">Sem motorista</option>{drivers.map((d) => <option key={d.id} value={d.id}>{d.name} (#{d.id})</option>)}</select></label><div className="admin-modal-actions"><button className="button button-small" disabled={saving} onClick={close} type="button">Cancelar</button><button className="button button-small button-success" disabled={saving} type="submit">{saving ? 'A guardar...' : 'Guardar'}</button></div></form></div> : null}</AdminLayout>
}
export default AdminVehiclesPage
