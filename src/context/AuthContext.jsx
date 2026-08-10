/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import { clearAuthSession, clearLegacySharedAuth, getAuthToken, getAuthUser, saveAuthSession, saveAuthUser } from '../services/authStorage'
const AuthContext=createContext(null)
export function AuthProvider({children}){const[user,setUser]=useState(getAuthUser),[token,setToken]=useState(getAuthToken),[isSessionLoading,setSessionLoading]=useState(true)
 const logout=()=>{clearAuthSession();setToken(null);setUser(null)}
 useEffect(()=>{clearLegacySharedAuth();let mounted=true;const invalidate=()=>{if(mounted)logout()};window.addEventListener('ahifambe:unauthorized',invalidate);const validate=async()=>{if(!getAuthToken()){if(mounted)setSessionLoading(false);return}try{const response=await api.get('/auth/me');if(mounted){setUser(response.data.user);saveAuthUser(response.data.user)}}catch(error){if(error.response?.status===401&&mounted)logout()}finally{if(mounted)setSessionLoading(false)}};validate();return()=>{mounted=false;window.removeEventListener('ahifambe:unauthorized',invalidate)}},[])
 const login=(authToken,authUser)=>{saveAuthSession(authToken,authUser);setToken(authToken);setUser(authUser)}
 const value=useMemo(()=>({user,token,login,logout,isSessionLoading,isAuthenticated:Boolean(token&&user)}),[token,user,isSessionLoading]);return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>}
export function useAuth(){const context=useContext(AuthContext);if(!context)throw new Error('useAuth must be used inside AuthProvider');return context}
