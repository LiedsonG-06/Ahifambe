import axios from 'axios'
import { getAuthToken } from './authStorage'
const configuredBase=import.meta.env.VITE_API_BASE_URL?.trim()
if(!configuredBase&&import.meta.env.PROD) throw new Error('VITE_API_BASE_URL is required in production.')
const baseURL=(configuredBase||'http://localhost:5000/api').replace(/\/+$/,'')
const api=axios.create({baseURL})
let unauthorizedDispatched=false
api.interceptors.request.use((config)=>{const token=getAuthToken();if(token)config.headers.Authorization=`Bearer ${token}`;return config})
api.interceptors.response.use((response)=>response,(error)=>{const url=String(error.config?.url||'');const isAuthEntry=url.includes('/auth/login')||url.includes('/auth/register');if(error.response?.status===401&&!isAuthEntry&&getAuthToken()&&!unauthorizedDispatched){unauthorizedDispatched=true;window.dispatchEvent(new CustomEvent('ahifambe:unauthorized'));window.setTimeout(()=>{unauthorizedDispatched=false},500)}return Promise.reject(error)})
export default api
