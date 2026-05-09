import { useCallback, useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { useAuth } from '../../context/AuthContext'
import { getActiveLocations } from '../../services/locationService'
import { getRoutes } from '../../services/routeService'

const MAPUTO_CENTER = [-25.9655, 32.5832]
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

function PassengerDashboard() {
  const { logout, user } = useAuth()
  const [routes, setRoutes] = useState([])
  const [locations, setLocations] = useState([])
  const [selectedRoute, setSelectedRoute] = useState('all')
  const [loadingRoutes, setLoadingRoutes] = useState(true)
  const [loadingLocations, setLoadingLocations] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

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
          <button className="button button-secondary" type="button" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      {error ? <div className="passenger-error">{error}</div> : null}

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
              </article>
            ))}
          </div>
        </aside>
      </section>
    </main>
  )
}

export default PassengerDashboard
