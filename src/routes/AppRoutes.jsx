import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminDashboard from '../pages/admin/AdminDashboard'
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
