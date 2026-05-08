import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function getDashboardPath(role) {
  const dashboards = {
    admin: '/admin',
    driver: '/driver',
    passenger: '/passenger',
  }

  return dashboards[role] || '/login'
}

function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardPath(user.role)} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
