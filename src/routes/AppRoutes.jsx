import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import LandingPage from '../pages/landing/LandingPage'
import ProtectedRoute from './ProtectedRoute'
const AdminDashboard=lazy(()=>import('../pages/admin/AdminDashboard'))
const AdminDriversPage=lazy(()=>import('../pages/admin/AdminDriversPage'))
const AdminFeedbackPage=lazy(()=>import('../pages/admin/AdminFeedbackPage'))
const AdminRoutesPage=lazy(()=>import('../pages/admin/AdminRoutesPage'))
const AdminTripsPage=lazy(()=>import('../pages/admin/AdminTripsPage'))
const AdminUsersPage=lazy(()=>import('../pages/admin/AdminUsersPage'))
const AdminVehiclesPage=lazy(()=>import('../pages/admin/AdminVehiclesPage'))
const DriverDashboard=lazy(()=>import('../pages/driver/DriverDashboard'))
const PassengerDashboard=lazy(()=>import('../pages/passenger/PassengerDashboard'))
function AppRoutes(){return <BrowserRouter><Suspense fallback={<div className="admin-state">A carregar página...</div>}><Routes>
 <Route path="/" element={<LandingPage/>}/><Route path="/login" element={<LoginPage/>}/><Route path="/register" element={<RegisterPage/>}/>
 <Route element={<ProtectedRoute allowedRoles={['admin']}/>}><Route path="/admin" element={<AdminDashboard/>}/><Route path="/admin/users" element={<AdminUsersPage/>}/><Route path="/admin/drivers" element={<AdminDriversPage/>}/><Route path="/admin/routes" element={<AdminRoutesPage/>}/><Route path="/admin/vehicles" element={<AdminVehiclesPage/>}/><Route path="/admin/trips" element={<AdminTripsPage/>}/><Route path="/admin/feedback" element={<AdminFeedbackPage/>}/></Route>
 <Route element={<ProtectedRoute allowedRoles={['driver']}/>}><Route path="/driver" element={<DriverDashboard/>}/></Route><Route element={<ProtectedRoute allowedRoles={['passenger']}/>}><Route path="/passenger" element={<PassengerDashboard/>}/></Route><Route path="*" element={<Navigate to="/" replace/>}/>
 </Routes></Suspense></BrowserRouter>}
export default AppRoutes