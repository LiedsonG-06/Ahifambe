import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function AdminLayout({ children, eyebrow, title, description }) {
  const { logout, user } = useAuth()

  return (
    <main className="admin-page">
      <aside className="admin-sidebar" aria-label="Menu de administracao">
        <div>
          <span className="admin-brand">Lili Transport</span>
          <p>Admin</p>
        </div>

        <nav className="admin-nav">
          <NavLink to="/admin" end>
            Visao Geral
          </NavLink>
          <NavLink to="/admin/users">Utilizadores</NavLink>
          <NavLink to="/admin/drivers">Motoristas</NavLink>
          <NavLink to="/admin/routes">Rotas</NavLink>
          <NavLink to="/admin/feedback">Feedback</NavLink>
        </nav>

        <button className="button button-secondary admin-logout" type="button" onClick={logout}>
          Sair
        </button>
      </aside>

      <section className="admin-content">
        <header className="admin-header">
          <div>
            <span className="eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            {description ? <p>{description}</p> : null}
          </div>
          <div className="admin-user">
            <strong>{user?.name}</strong>
            <span>{user?.role}</span>
          </div>
        </header>

        {children}
      </section>
    </main>
  )
}

export default AdminLayout
