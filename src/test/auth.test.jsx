import { act, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from '../context/AuthContext'
import ProtectedRoute from '../routes/ProtectedRoute'
import api from '../services/api'
vi.mock('../services/api', () => ({ default: { get: vi.fn() } }))
function SessionProbe(){const auth=useAuth();return <div>{auth.isSessionLoading?'loading':auth.user?.email||'anonymous'}</div>}
const stored=(email='kept@test',role='passenger')=>{localStorage.setItem('ahifambe_token','synthetic-token');localStorage.setItem('ahifambe_user',JSON.stringify({email,role}))}
describe('session validation',()=>{beforeEach(()=>{localStorage.clear();sessionStorage.clear();api.get.mockReset()})
 it('validates a stored session with /auth/me',async()=>{stored('stale@test');api.get.mockResolvedValue({data:{user:{email:'valid@test',role:'passenger'}}});render(<AuthProvider><SessionProbe/></AuthProvider>);expect(screen.getByText('loading')).toBeInTheDocument();await waitFor(()=>expect(screen.getByText('valid@test')).toBeInTheDocument());expect(api.get).toHaveBeenCalledWith('/auth/me')})
 it('clears an invalid session after a confirmed 401',async()=>{stored();api.get.mockRejectedValue({response:{status:401}});render(<AuthProvider><SessionProbe/></AuthProvider>);await waitFor(()=>expect(screen.getByText('anonymous')).toBeInTheDocument());expect(localStorage.getItem('ahifambe_token')).toBeNull()})
 it('does not clear a session on 403',async()=>{stored();api.get.mockRejectedValue({response:{status:403}});render(<AuthProvider><SessionProbe/></AuthProvider>);await waitFor(()=>expect(screen.getByText('kept@test')).toBeInTheDocument());expect(localStorage.getItem('ahifambe_token')).toBe('synthetic-token')})
 it('does not clear a session on network failure',async()=>{stored();api.get.mockRejectedValue(new Error('network'));render(<AuthProvider><SessionProbe/></AuthProvider>);await waitFor(()=>expect(screen.getByText('kept@test')).toBeInTheDocument());expect(localStorage.getItem('ahifambe_token')).toBe('synthetic-token')})
 it('logs out when the global unauthorized event is emitted',async()=>{stored('valid@test');api.get.mockResolvedValue({data:{user:{email:'valid@test',role:'passenger'}}});render(<AuthProvider><SessionProbe/></AuthProvider>);await waitFor(()=>screen.getByText('valid@test'));act(()=>window.dispatchEvent(new CustomEvent('ahifambe:unauthorized')));expect(screen.getByText('anonymous')).toBeInTheDocument()})
})
describe('ProtectedRoute',()=>{beforeEach(()=>{localStorage.clear();api.get.mockReset()})
 const renderRoutes=()=>render(<AuthProvider><MemoryRouter initialEntries={['/admin']}><Routes><Route element={<ProtectedRoute allowedRoles={['admin']}/>}><Route path="/admin" element={<div>protected content</div>}/></Route><Route path="/login" element={<div>login page</div>}/></Routes></MemoryRouter></AuthProvider>)
 it('hides protected content while session validation is loading',()=>{stored('admin@test','admin');api.get.mockReturnValue(new Promise(()=>{}));renderRoutes();expect(screen.getByText('A validar sessão...')).toBeInTheDocument();expect(screen.queryByText('protected content')).not.toBeInTheDocument()})
 it('renders protected content after a valid session',async()=>{stored('admin@test','admin');api.get.mockResolvedValue({data:{user:{email:'admin@test',role:'admin'}}});renderRoutes();await waitFor(()=>expect(screen.getByText('protected content')).toBeInTheDocument())})
 it('redirects after an invalid session',async()=>{stored('admin@test','admin');api.get.mockRejectedValue({response:{status:401}});renderRoutes();await waitFor(()=>expect(screen.getByText('login page')).toBeInTheDocument())})
})