import { useCallback, useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { useAuth } from '../../context/AuthContext'
import { createFeedback } from '../../services/feedbackService'
import { getActiveLocations } from '../../services/locationService'
import { createRideRequest } from '../../services/rideRequestService'
import { getRoutes } from '../../services/routeService'

const MAPUTO_CENTER = [-25.9655, 32.5832]
const INITIAL_RIDE_REQUEST_FORM = {
  destination: '',
  people_count: '1',
  note: '',
}
const INITIAL_FEEDBACK_FORM = {
  type: 'reclamacao',
  message: '',
}
const FEEDBACK_TYPE_OPTIONS = [
  { value: 'reclamacao', label: 'Reclamacao' },
  { value: 'sugestao', label: 'Sugestao' },
  { value: 'elogio', label: 'Elogio' },
]
const LOTACAO_OPTIONS = {
  vazio: { label: 'Vazio', markerClass: 'passenger-marker-vazio' },
  intermedio: { label: 'Intermedio', markerClass: 'passenger-marker-intermedio' },
  lotado: { label: 'Lotado', markerClass: 'passenger-marker-lotado' },
}

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const LOTACAO_ICONS = Object.fromEntries(
  Object.entries(LOTACAO_OPTIONS).map(([value, option]) => [
    value,
    L.divIcon({
      className: `passenger-marker ${option.markerClass}`,
      html: '<span></span>',
      iconAnchor: [12, 24],
      iconSize: [24, 24],
      popupAnchor: [0, -24],
    }),
  ]),
)

function normalizeRouteId(route) {
  return String(route.id ?? route.route_id ?? route.routeId ?? route.nome ?? route.name ?? '')
}

function normalizeRouteName(route) {
  return route.nome ?? route.name ?? route.route_nome ?? 'Rota sem nome'
}

function normalizeLotacao(value) {
  const lotacao = String(value || '').trim().toLowerCase()
  return LOTACAO_OPTIONS[lotacao] ? lotacao : 'vazio'
}

function getLotacaoLabel(value) {
  return LOTACAO_OPTIONS[normalizeLotacao(value)].label
}

function formatLastUpdate(value) {
  if (!value) {
    return 'Sem actualizacao'
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Sem actualizacao' : date.toLocaleTimeString()
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 15000,
    })
  })
}

function normalizeActiveLocation(location) {
  const lotacao = normalizeLotacao(location.lotacao ?? location.status_lotacao)

  return {
    ...location,
    latitude: Number(location.latitude),
    longitude: Number(location.longitude),
    routeId: String(location.route_id ?? location.routeId ?? location.route_nome ?? ''),
    routeName: location.route_nome ?? location.nome ?? location.route_name ?? 'Rota sem nome',
    status: location.status ?? location.trip_status ?? location.viagem_status ?? 'in_progress',
    lotacao,
    lotacaoLabel: getLotacaoLabel(lotacao),
  }
}

function MapBounds({ locations }) {
  const map = useMap()

  useEffect(() => {
    const points = locations.map((location) => [location.latitude, location.longitude])

    if (points.length === 1) {
      map.setView(points[0], Math.max(map.getZoom(), 14), { animate: true })
      return
    }

    if (points.length > 1) {
      map.fitBounds(points, { animate: true, padding: [36, 36] })
    }
  }, [locations, map])

  return null
}

function RequestModalMapResize() {
  const map = useMap()

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      map.invalidateSize()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [map])

  return null
}

function PassengerDashboard() {
  const { logout, user } = useAuth()
  const [routes, setRoutes] = useState([])
  const [locations, setLocations] = useState([])
  const [selectedRoute, setSelectedRoute] = useState('all')
  const [loadingRoutes, setLoadingRoutes] = useState(true)
  const [loadingLocations, setLoadingLocations] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [selectedRideLocation, setSelectedRideLocation] = useState(null)
  const [rideRequestForm, setRideRequestForm] = useState(INITIAL_RIDE_REQUEST_FORM)
  const [isRideRequestSubmitting, setIsRideRequestSubmitting] = useState(false)
  const [isFeedbackFormOpen, setIsFeedbackFormOpen] = useState(false)
  const [feedbackForm, setFeedbackForm] = useState(INITIAL_FEEDBACK_FORM)
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false)

  const loadRoutes = useCallback(async () => {
    setLoadingRoutes(true)

    try {
      const routesData = await getRoutes()
      setRoutes(routesData)
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Nao foi possivel carregar as rotas.')
    } finally {
      setLoadingRoutes(false)
    }
  }, [])

  const loadActiveLocations = useCallback(async () => {
    setLoadingLocations(true)

    try {
      const locationsData = await getActiveLocations()
      const inProgressLocations = locationsData
        .map(normalizeActiveLocation)
        .filter((location) => {
          return (
            location.status === 'in_progress' &&
            Number.isFinite(location.latitude) &&
            Number.isFinite(location.longitude)
          )
        })

      setLocations(inProgressLocations)
      setLastUpdated(new Date())
      setError('')
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Nao foi possivel carregar as chapas activas.')
    } finally {
      setLoadingLocations(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadRoutes()
      loadActiveLocations()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadRoutes, loadActiveLocations])

  useEffect(() => {
    const intervalId = window.setInterval(loadActiveLocations, 5000)

    return () => window.clearInterval(intervalId)
  }, [loadActiveLocations])

  const filteredLocations = useMemo(() => {
    if (selectedRoute === 'all') {
      return locations
    }

    return locations.filter((location) => location.routeName === selectedRoute || location.routeId === selectedRoute)
  }, [locations, selectedRoute])

  const routeOptions = useMemo(() => {
    const routeMap = new Map()

    routes.forEach((route) => {
      const id = normalizeRouteId(route)

      if (id) {
        routeMap.set(id, {
          id,
          nome: normalizeRouteName(route),
          origem: route.origem ?? 'Origem nao definida',
          destino: route.destino ?? 'Destino nao definido',
        })
      }
    })

    locations.forEach((location) => {
      if (!routeMap.has(location.routeId || location.routeName)) {
        routeMap.set(location.routeId || location.routeName, {
          id: location.routeId || location.routeName,
          nome: location.routeName,
          origem: location.origem ?? 'Origem nao definida',
          destino: location.destino ?? 'Destino nao definido',
        })
      }
    })

    return Array.from(routeMap.values())
  }, [locations, routes])

  const isLoading = loadingRoutes || loadingLocations

  function openRideRequestForm(location) {
    setError('')
    setSuccess('')
    setSelectedRideLocation(location)
    setRideRequestForm({
      ...INITIAL_RIDE_REQUEST_FORM,
      destination: location.destino ?? '',
    })
  }

  function closeRideRequestForm() {
    if (isRideRequestSubmitting) {
      return
    }

    setSelectedRideLocation(null)
    setRideRequestForm(INITIAL_RIDE_REQUEST_FORM)
  }

  function handleRideRequestInputChange(event) {
    const { name, value } = event.target
    setRideRequestForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))
  }

  function closeFeedbackForm() {
    if (isFeedbackSubmitting) {
      return
    }

    setIsFeedbackFormOpen(false)
    setFeedbackForm(INITIAL_FEEDBACK_FORM)
  }

  function handleFeedbackInputChange(event) {
    const { name, value } = event.target
    setFeedbackForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))
  }

  async function handleFeedbackSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const message = feedbackForm.message.trim()

    if (!message) {
      setError('Escreva a mensagem antes de enviar o feedback.')
      return
    }

    setIsFeedbackSubmitting(true)

    try {
      await createFeedback({
        type: feedbackForm.type,
        message,
      })

      setIsFeedbackFormOpen(false)
      setFeedbackForm(INITIAL_FEEDBACK_FORM)
      setSuccess('Feedback enviado ao administrador.')
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Nao foi possivel enviar o feedback.')
    } finally {
      setIsFeedbackSubmitting(false)
    }
  }

  async function handleRideRequestSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!selectedRideLocation) {
      setError('Seleccione uma chapa activa antes de enviar o pedido.')
      return
    }

    if (!('geolocation' in navigator)) {
      setError('Geolocalizacao nao esta disponivel neste navegador.')
      return
    }

    setIsRideRequestSubmitting(true)

    try {
      const position = await getCurrentPosition()

      await createRideRequest({
        driver_id: selectedRideLocation.driver_id,
        trip_id: selectedRideLocation.trip_id,
        passenger_latitude: position.coords.latitude,
        passenger_longitude: position.coords.longitude,
        destination: rideRequestForm.destination.trim(),
        people_count: Number(rideRequestForm.people_count),
        note: rideRequestForm.note.trim() || undefined,
      })

      setSelectedRideLocation(null)
      setRideRequestForm(INITIAL_RIDE_REQUEST_FORM)
      setSuccess('Pedido enviado ao motorista.')
    } catch (apiError) {
      setError(apiError.response?.data?.message || apiError.message || 'Nao foi possivel enviar o pedido.')
    } finally {
      setIsRideRequestSubmitting(false)
    }
  }

  return (
    <main className="passenger-page">
      <header className="passenger-header">
        <div>
          <span className="eyebrow">Painel do passageiro</span>
          <h1>Ola, {user?.name || 'passageiro'}</h1>
          <p>Veja chapas em viagem activa e acompanhe a posicao actual no mapa.</p>
        </div>

        <div className="passenger-header-actions">
          <span className="passenger-live-status">
            {loadingLocations ? 'A actualizar...' : `${filteredLocations.length} chapas activas`}
          </span>
          <button
            className="button"
            type="button"
            onClick={() => {
              setError('')
              setSuccess('')
              setIsFeedbackFormOpen(true)
            }}
          >
            Enviar feedback
          </button>
          <button className="button button-secondary" type="button" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      {error ? <div className="passenger-error">{error}</div> : null}
      {success ? <div className="passenger-success">{success}</div> : null}

      <section className="passenger-toolbar">
        <label className="passenger-field">
          <span>Filtrar por rota</span>
          <select value={selectedRoute} onChange={(event) => setSelectedRoute(event.target.value)}>
            <option value="all">Todas as rotas</option>
            {routeOptions.map((route) => (
              <option key={route.id} value={route.nome}>
                {route.nome} - {route.origem} para {route.destino}
              </option>
            ))}
          </select>
        </label>

        <button className="button" type="button" onClick={loadActiveLocations} disabled={loadingLocations}>
          Actualizar agora
        </button>

        <div className="passenger-location-state">
          <span>Estado da localizacao</span>
          <strong>{lastUpdated ? `Actualizado as ${lastUpdated.toLocaleTimeString()}` : 'A aguardar dados'}</strong>
        </div>
      </section>

      <section className="passenger-grid">
        <aside className="passenger-panel">
          <div className="passenger-panel-header">
            <div>
              <span className="eyebrow">Rotas disponiveis</span>
              <strong>{routes.length}</strong>
            </div>
          </div>

          {loadingRoutes ? <div className="passenger-state">A carregar rotas...</div> : null}

          {!loadingRoutes && routes.length === 0 ? <div className="passenger-state">Nenhuma rota disponivel.</div> : null}

          <div className="passenger-route-list">
            {routes.map((route) => (
              <button
                className={selectedRoute === normalizeRouteName(route) ? 'passenger-route active' : 'passenger-route'}
                key={normalizeRouteId(route)}
                type="button"
                onClick={() => setSelectedRoute(normalizeRouteName(route))}
              >
                <strong>{normalizeRouteName(route)}</strong>
                <span>
                  {route.origem ?? 'Origem nao definida'} para {route.destino ?? 'Destino nao definido'}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="passenger-map-panel">
          <MapContainer center={MAPUTO_CENTER} className="passenger-map" scrollWheelZoom zoom={12}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapBounds locations={filteredLocations} />
            {filteredLocations.map((location) => (
              <Marker
                key={`${location.trip_id}-${location.driver_id}-${location.latitude}-${location.longitude}`}
                icon={LOTACAO_ICONS[location.lotacao]}
                position={[location.latitude, location.longitude]}
              >
                <Popup>
                  <div className="passenger-popup">
                    <strong>{location.routeName}</strong>
                    <span>
                      Origem: {location.origem ?? 'Origem nao definida'}
                    </span>
                    <span>Destino: {location.destino ?? 'Destino nao definido'}</span>
                    <span>Matricula: {location.plate_number ?? 'Nao informada'}</span>
                    <span>Modelo: {location.model ?? 'Nao informado'}</span>
                    <span className={`passenger-lotacao passenger-lotacao-${location.lotacao}`}>
                      Lotacao: {location.lotacaoLabel}
                    </span>
                    <button className="button passenger-request-button" type="button" onClick={() => openRideRequestForm(location)}>
                      Requisitar Chapa
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </section>

        <aside className="passenger-panel passenger-active-panel">
          <div className="passenger-panel-header">
            <div>
              <span className="eyebrow">Chapas activos</span>
              <strong>{filteredLocations.length}</strong>
            </div>
          </div>

          {isLoading ? <div className="passenger-state">A carregar chapas activas...</div> : null}

          {!isLoading && filteredLocations.length === 0 ? (
            <div className="passenger-state">Nao ha chapas activos nesta rota.</div>
          ) : null}

          <div className="passenger-chapa-list">
            {filteredLocations.map((location) => (
              <article className="passenger-chapa-card" key={`${location.trip_id}-${location.driver_id}`}>
                <span>{location.routeName}</span>
                <strong>{location.plate_number ?? 'Matricula nao informada'}</strong>
                <small>{location.model ?? 'Modelo nao informado'}</small>
                <small className={`passenger-lotacao passenger-lotacao-${location.lotacao}`}>
                  Lotacao: {location.lotacaoLabel}
                </small>
                <p>
                  {location.origem ?? 'Origem nao definida'} para {location.destino ?? 'Destino nao definido'}
                </p>
                <small>Ultima actualizacao: {formatLastUpdate(location.recorded_at)}</small>
                <button className="button passenger-request-button" type="button" onClick={() => openRideRequestForm(location)}>
                  Requisitar Chapa
                </button>
              </article>
            ))}
          </div>
        </aside>
      </section>

      {selectedRideLocation ? (
        <div className="passenger-modal-backdrop" role="presentation">
          <form
            aria-labelledby="passenger-ride-request-title"
            className="passenger-request-modal"
            onSubmit={handleRideRequestSubmit}
            role="dialog"
          >
            <div className="passenger-panel-header">
              <div>
                <span className="eyebrow">Pedido de chapa</span>
                <strong id="passenger-ride-request-title">Requisitar Chapa</strong>
              </div>
              <button
                aria-label="Fechar formulario"
                className="driver-modal-close"
                disabled={isRideRequestSubmitting}
                onClick={closeRideRequestForm}
                type="button"
              >
                x
              </button>
            </div>

            <div className="passenger-request-modal-body">
              <div className="passenger-request-trip">
                <span>{selectedRideLocation.routeName}</span>
                <strong>{selectedRideLocation.plate_number ?? 'Matricula nao informada'}</strong>
              </div>

              <div className="passenger-request-map-wrap">
                <MapContainer
                  center={[selectedRideLocation.latitude, selectedRideLocation.longitude]}
                  className="passenger-request-map"
                  scrollWheelZoom={false}
                  zoom={15}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <RequestModalMapResize />
                  <Marker
                    icon={LOTACAO_ICONS[selectedRideLocation.lotacao]}
                    position={[selectedRideLocation.latitude, selectedRideLocation.longitude]}
                  />
                </MapContainer>
              </div>

              <label className="passenger-field">
                <span>Destino</span>
                <input
                  autoComplete="off"
                  name="destination"
                  onChange={handleRideRequestInputChange}
                  required
                  value={rideRequestForm.destination}
                />
              </label>

              <label className="passenger-field">
                <span>Numero de pessoas</span>
                <input
                  min="1"
                  name="people_count"
                  onChange={handleRideRequestInputChange}
                  required
                  type="number"
                  value={rideRequestForm.people_count}
                />
              </label>

              <label className="passenger-field">
                <span>Observacao opcional</span>
                <textarea
                  name="note"
                  onChange={handleRideRequestInputChange}
                  rows="3"
                  value={rideRequestForm.note}
                />
              </label>
            </div>

            <div className="driver-actions passenger-request-actions">
              <button className="button" disabled={isRideRequestSubmitting} type="submit">
                {isRideRequestSubmitting ? 'A enviar...' : 'Enviar pedido'}
              </button>
              <button
                className="button button-secondary"
                disabled={isRideRequestSubmitting}
                onClick={closeRideRequestForm}
                type="button"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {isFeedbackFormOpen ? (
        <div className="passenger-modal-backdrop" role="presentation">
          <form
            aria-labelledby="passenger-feedback-title"
            className="passenger-request-modal"
            onSubmit={handleFeedbackSubmit}
            role="dialog"
          >
            <div className="passenger-panel-header">
              <div>
                <span className="eyebrow">Feedback</span>
                <strong id="passenger-feedback-title">Enviar feedback</strong>
              </div>
              <button
                aria-label="Fechar formulario"
                className="driver-modal-close"
                disabled={isFeedbackSubmitting}
                onClick={closeFeedbackForm}
                type="button"
              >
                x
              </button>
            </div>

            <div className="passenger-request-modal-body">
              <label className="passenger-field">
                <span>Tipo</span>
                <select name="type" onChange={handleFeedbackInputChange} value={feedbackForm.type}>
                  {FEEDBACK_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="passenger-field">
                <span>Mensagem</span>
                <textarea
                  name="message"
                  onChange={handleFeedbackInputChange}
                  required
                  rows="5"
                  value={feedbackForm.message}
                />
              </label>
            </div>

            <div className="driver-actions passenger-request-actions">
              <button className="button" disabled={isFeedbackSubmitting} type="submit">
                {isFeedbackSubmitting ? 'A enviar...' : 'Enviar'}
              </button>
              <button
                className="button button-secondary"
                disabled={isFeedbackSubmitting}
                onClick={closeFeedbackForm}
                type="button"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  )
}

export default PassengerDashboard
