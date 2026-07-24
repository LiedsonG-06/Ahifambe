/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../services/api'
const AuthContext=createContext(null),USER_KEY='ahifambe_user',TOKEN_KEY='ahifambe_token'
const readUser=()=>{try{return JSON.parse(localStorage.getItem(USER_KEY)||'null')}catch{localStorage.removeItem(USER_KEY);return null}}
const clearSessionStorage=()=>{localStorage.removeItem(TOKEN_KEY);localStorage.removeItem(USER_KEY);sessionStorage.clear()}
export function AuthProvider({children}){const[user,setUser]=useState(readUser),[token,setToken]=useState(()=>localStorage.getItem(TOKEN_KEY)),[isSessionLoading,setSessionLoading]=useState(true)
 const logout=()=>{clearSessionStorage();setToken(null);setUser(null)}
 useEffect(()=>{let mounted=true;const invalidate=()=>{if(mounted)logout()};window.addEventListener('ahifambe:unauthorized',invalidate);const validate=async()=>{if(!localStorage.getItem(TOKEN_KEY)){if(mounted)setSessionLoading(false);return}try{const response=await api.get('/auth/me');if(mounted){setUser(response.data.user);localStorage.setItem(USER_KEY,JSON.stringify(response.data.user))}}catch(error){if(error.response?.status===401&&mounted)logout()}finally{if(mounted)setSessionLoading(false)}};validate();return()=>{mounted=false;window.removeEventListener('ahifambe:unauthorized',invalidate)}},[])
 const login=(authToken,authUser)=>{localStorage.setItem(TOKEN_KEY,authToken);localStorage.setItem(USER_KEY,JSON.stringify(authUser));setToken(authToken);setUser(authUser)}
 const value=useMemo(()=>({user,token,login,logout,isSessionLoading,isAuthenticated:Boolean(token&&user)}),[token,user,isSessionLoading]);return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>}
export function useAuth(){const context=useContext(AuthContext);if(!context)throw new Error('useAuth must be used inside AuthProvider');return context}