import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminDriversPage from '../pages/admin/AdminDriversPage'
import AdminFeedbackPage from '../pages/admin/AdminFeedbackPage'
import AdminRoutesPage from '../pages/admin/AdminRoutesPage'
import AdminUsersPage from '../pages/admin/AdminUsersPage'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import DriverDashboard from '../pages/driver/DriverDashboard'
import LandingPage from '../pages/landing/LandingPage'
import PassengerDashboard from '../pages/passenger/PassengerDashboard'
import ProtectedRoute from './ProtectedRoute'

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/drivers" element={<AdminDriversPage />} />
          <Route path="/admin/routes" element={<AdminRoutesPage />} />
          <Route path="/admin/feedback" element={<AdminFeedbackPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['driver']} />}>
          <Route path="/driver" element={<DriverDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['passenger']} />}>
          <Route path="/passenger" element={<PassengerDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
