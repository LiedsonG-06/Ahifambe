import { useAuth } from '../../context/AuthContext'

function PassengerDashboard() {
  const { logout, user } = useAuth()

  return (
    <main className="dashboard-page">
      <section className="dashboard-shell">
        <div>
          <span className="eyebrow">Painel do passageiro</span>
          <h1>Bem-vindo, {user.name}</h1>
          <p>Perfil: {user.role}</p>
        </div>
        <button className="button button-secondary" type="button" onClick={logout}>
          Logout
        </button>
      </section>
    </main>
  )
}

export default PassengerDashboard
