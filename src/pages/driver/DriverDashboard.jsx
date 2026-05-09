import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { updateLocation } from '../../services/locationService'
import { getRoutes } from '../../services/routeService'
import { endTrip, startTrip } from '../../services/tripService'
import { createVehicle, getVehicles } from '../../services/vehicleService'

const ACTIVE_TRIP_STORAGE_KEY = 'ahifambe_active_trip'
const INITIAL_VEHICLE_FORM = {
  plate_number: '',
  model: '',
  capacity: '',
}

function getApiErrorMessage(error) {
  return error?.response?.data?.message || error.message || 'Nao foi possivel concluir a operacao.'
}

function readStoredActiveTrip() {
  const storedTrip = localStorage.getItem(ACTIVE_TRIP_STORAGE_KEY)

  if (!storedTrip) {
    return null
  }

  try {
    return JSON.parse(storedTrip)
  } catch {
    localStorage.removeItem(ACTIVE_TRIP_STORAGE_KEY)
    return null
  }
}

function getTripId(trip) {
  return trip?.id || trip?.trip_id || null
}

function formatVehicle(vehicle) {
  const parts = [vehicle.plate_number, vehicle.model].filter(Boolean)
  return parts.length ? parts.join(' - ') : `Veiculo #${vehicle.id}`
}

function getStatusLabel(activeTrip, isLocationActive) {
  if (activeTrip) {
    return 'Em viagem'
  }

  if (isLocationActive) {
    return 'Disponivel'
  }

  return 'Offline'
}

function DriverDashboard() {
  const { logout, user } = useAuth()
  const watcherIdRef = useRef(null)
  const activeTripRef = useRef(null)
  const [routes, setRoutes] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [selectedRouteId, setSelectedRouteId] = useState('')
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  const [activeTrip, setActiveTrip] = useState(() => readStoredActiveTrip())
  const [completedTrip, setCompletedTrip] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVehicleFormOpen, setIsVehicleFormOpen] = useState(false)
  const [isVehicleSaving, setIsVehicleSaving] = useState(false)
  const [vehicleForm, setVehicleForm] = useState(INITIAL_VEHICLE_FORM)
  const [isLocationActive, setIsLocationActive] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [locationStatus, setLocationStatus] = useState('')

  const driverVehicles = useMemo(() => vehicles, [vehicles])

  const statusLabel = getStatusLabel(activeTrip, isLocationActive)
  const activeTripId = getTripId(activeTrip)

  useEffect(() => {
    activeTripRef.current = activeTrip

    if (activeTrip) {
      localStorage.setItem(ACTIVE_TRIP_STORAGE_KEY, JSON.stringify(activeTrip))
    } else {
      localStorage.removeItem(ACTIVE_TRIP_STORAGE_KEY)
    }
  }, [activeTrip])

  useEffect(() => {
    let isMounted = true

    Promise.all([getRoutes(), getVehicles()])
      .then(([routesData, vehiclesData]) => {
        if (isMounted) {
          setRoutes(routesData)
          setVehicles(vehiclesData)
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

  useEffect(() => {
    return () => {
      if (watcherIdRef.current !== null) {
        navigator.geolocation.clearWatch(watcherIdRef.current)
      }
    }
  }, [])

  function clearMessages() {
    setError('')
    setSuccess('')
  }

  async function refreshVehicles() {
    const vehiclesData = await getVehicles()
    setVehicles(vehiclesData)
    return vehiclesData
  }

  function handleVehicleInputChange(event) {
    const { name, value } = event.target
    setVehicleForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))
  }

  function closeVehicleForm() {
    setIsVehicleFormOpen(false)
    setVehicleForm(INITIAL_VEHICLE_FORM)
  }

  async function handleCreateVehicle(event) {
    event.preventDefault()
    clearMessages()
    setIsVehicleSaving(true)

    try {
      const result = await createVehicle({
        plate_number: vehicleForm.plate_number.trim(),
        model: vehicleForm.model.trim(),
        capacity: Number(vehicleForm.capacity),
      })
      closeVehicleForm()
      const vehiclesData = await refreshVehicles()
      const createdVehicleId = result?.vehicle?.id

      if (!vehiclesData.length) {
        setSelectedVehicleId('')
        setError('A viatura foi criada, mas não foi associada ao motorista autenticado.')
        return
      }

      if (createdVehicleId && vehiclesData.some((vehicle) => Number(vehicle.id) === Number(createdVehicleId))) {
        setSelectedVehicleId(String(createdVehicleId))
      }

      setSuccess(result?.message || 'Viatura adicionada com sucesso.')
    } catch (apiError) {
      setError(getApiErrorMessage(apiError))
    } finally {
      setIsVehicleSaving(false)
    }
  }

  function stopLocationTracking() {
    if (watcherIdRef.current !== null) {
      navigator.geolocation.clearWatch(watcherIdRef.current)
      watcherIdRef.current = null
    }

    setIsLocationActive(false)
    setLocationStatus('Localizacao desactivada.')
  }

  async function handleStartTrip(event) {
    event.preventDefault()
    clearMessages()
    setCompletedTrip(null)
    setIsSubmitting(true)

    try {
      const result = await startTrip({
        route_id: Number(selectedRouteId),
        vehicle_id: Number(selectedVehicleId),
      })

      setActiveTrip(result.trip)
      setSuccess('Viagem iniciada com sucesso.')
    } catch (apiError) {
      setError(getApiErrorMessage(apiError))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleEndTrip() {
    clearMessages()

    if (!activeTripId) {
      setError('Nao existe uma viagem activa para terminar.')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await endTrip(activeTripId)
      stopLocationTracking()
      setActiveTrip(null)
      setCompletedTrip(result.trip)
      setSuccess('Viagem terminada com sucesso.')
    } catch (apiError) {
      setError(getApiErrorMessage(apiError))
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleActivateLocation() {
    clearMessages()

    if (!activeTripId) {
      setError('Inicie uma viagem antes de activar a localizacao.')
      return
    }

    if (!('geolocation' in navigator)) {
      setError('Geolocalizacao nao esta disponivel neste navegador.')
      return
    }

    if (watcherIdRef.current !== null) {
      setLocationStatus('Localizacao ja esta activa.')
      return
    }

    watcherIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const tripId = getTripId(activeTripRef.current)

        if (!tripId) {
          stopLocationTracking()
          return
        }

        updateLocation({
          trip_id: tripId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
          .then(() => {
            setLocationStatus('Localizacao enviada automaticamente.')
          })
          .catch((apiError) => {
            setError(getApiErrorMessage(apiError))
          })
      },
      (geoError) => {
        setError(geoError.message || 'Nao foi possivel obter a localizacao.')
        stopLocationTracking()
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000,
      },
    )

    setIsLocationActive(true)
    setLocationStatus('Localizacao activa.')
  }

  function handleDeactivateLocation() {
    clearMessages()
    stopLocationTracking()
  }

  return (
    <main className="driver-page">
      <header className="driver-header">
        <div>
          <span className="eyebrow">Painel do motorista</span>
          <h1>Bem-vindo, {user.name}</h1>
          <p>Escolha a rota e o veiculo antes de iniciar a viagem.</p>
        </div>
        <div className="driver-header-actions">
          <span className={`driver-status driver-status-${statusLabel.toLowerCase().replace(' ', '-')}`}>
            {statusLabel}
          </span>
          <button className="button button-secondary" type="button" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <section className="driver-grid">
        <form className="driver-panel" onSubmit={handleStartTrip}>
          <div className="driver-panel-header">
            <span>Viagem</span>
            <strong>{activeTrip?.status || completedTrip?.status || 'Disponivel'}</strong>
          </div>

          {isLoading ? <div className="driver-state">A carregar rotas e veiculos...</div> : null}
          {error ? <div className="driver-error">{error}</div> : null}
          {success ? <div className="driver-success">{success}</div> : null}

          <label className="driver-field">
            <span>Rota</span>
            <select
              disabled={Boolean(activeTrip) || isLoading}
              onChange={(event) => setSelectedRouteId(event.target.value)}
              required
              value={selectedRouteId}
            >
              <option value="">Seleccionar rota</option>
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.nome} - {route.origem} para {route.destino}
                </option>
              ))}
            </select>
          </label>

          <label className="driver-field">
            <span>Veiculo</span>
            <select
              disabled={Boolean(activeTrip) || isLoading}
              onChange={(event) => setSelectedVehicleId(event.target.value)}
              required
              value={selectedVehicleId}
            >
              <option value="">Seleccionar veiculo</option>
              {driverVehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {formatVehicle(vehicle)}
                </option>
              ))}
            </select>
          </label>

          {!isLoading && !driverVehicles.length ? (
            <div className="driver-state">Nenhum veiculo associado ao motorista autenticado.</div>
          ) : null}

          <div className="driver-vehicle-summary">
            <div>
              <span>Minhas viaturas</span>
              <strong>{driverVehicles.length}</strong>
            </div>
            <button
              className="button driver-add-vehicle-button"
              disabled={isLoading}
              onClick={() => {
                clearMessages()
                setIsVehicleFormOpen(true)
              }}
              type="button"
            >
              Adicionar Viatura
            </button>
          </div>

          {driverVehicles.length ? (
            <div className="driver-vehicle-list" aria-label="Viaturas do motorista">
              {driverVehicles.map((vehicle) => (
                <article className="driver-vehicle-card" key={vehicle.id}>
                  <span>{vehicle.plate_number || 'Sem matricula'}</span>
                  <strong>{vehicle.model || 'Modelo nao informado'}</strong>
                  <small>Capacidade: {vehicle.capacity || 0} passageiros</small>
                </article>
              ))}
            </div>
          ) : null}

          <div className="driver-actions">
            <button
              className="button"
              disabled={Boolean(activeTrip) || isSubmitting || !selectedRouteId || !selectedVehicleId}
              type="submit"
            >
              Iniciar viagem
            </button>
            <button
              className="button button-secondary"
              disabled={!activeTrip || isSubmitting}
              onClick={handleEndTrip}
              type="button"
            >
              Terminar viagem
            </button>
          </div>
        </form>

        <section className="driver-panel">
          <div className="driver-panel-header">
            <span>Localizacao</span>
            <strong>{isLocationActive ? 'Activa' : 'Inactiva'}</strong>
          </div>

          <div className="driver-trip-card">
            <span>Viagem activa</span>
            <strong>{activeTripId ? `#${activeTripId}` : 'Nenhuma'}</strong>
            <small>Status: {activeTrip?.status || completedTrip?.status || 'offline'}</small>
          </div>

          {locationStatus ? <div className="driver-state">{locationStatus}</div> : null}

          <div className="driver-actions">
            <button
              className="button"
              disabled={!activeTrip || isLocationActive}
              onClick={handleActivateLocation}
              type="button"
            >
              Activar Localizacao
            </button>
            <button
              className="button button-secondary"
              disabled={!isLocationActive}
              onClick={handleDeactivateLocation}
              type="button"
            >
              Desactivar Localizacao
            </button>
          </div>
        </section>
      </section>

      {isVehicleFormOpen ? (
        <div className="driver-modal-backdrop" role="presentation">
          <form
            aria-labelledby="driver-vehicle-modal-title"
            className="driver-vehicle-modal"
            onSubmit={handleCreateVehicle}
            role="dialog"
          >
            <div className="driver-panel-header">
              <div>
                <span>Nova viatura</span>
                <strong id="driver-vehicle-modal-title">Adicionar Viatura</strong>
              </div>
              <button
                className="driver-modal-close"
                disabled={isVehicleSaving}
                onClick={closeVehicleForm}
                type="button"
                aria-label="Fechar formulario"
              >
                x
              </button>
            </div>

            {error ? <div className="driver-error">{error}</div> : null}

            <label className="driver-field">
              <span>Matricula</span>
              <input
                autoComplete="off"
                name="plate_number"
                onChange={handleVehicleInputChange}
                placeholder="ABC-123-MP"
                required
                value={vehicleForm.plate_number}
              />
            </label>

            <label className="driver-field">
              <span>Modelo</span>
              <input
                autoComplete="off"
                name="model"
                onChange={handleVehicleInputChange}
                placeholder="Toyota Hiace"
                required
                value={vehicleForm.model}
              />
            </label>

            <label className="driver-field">
              <span>Capacidade</span>
              <input
                min="1"
                name="capacity"
                onChange={handleVehicleInputChange}
                placeholder="15"
                required
                type="number"
                value={vehicleForm.capacity}
              />
            </label>

            <div className="driver-actions">
              <button className="button driver-add-vehicle-button" disabled={isVehicleSaving} type="submit">
                {isVehicleSaving ? 'A guardar...' : 'Guardar viatura'}
              </button>
              <button
                className="button button-secondary"
                disabled={isVehicleSaving}
                onClick={closeVehicleForm}
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

export default DriverDashboard
