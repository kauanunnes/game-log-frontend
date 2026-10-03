import type { Me, TokenResponse } from '@/types/api'
import { api } from './client'

export interface Credentials {
  login: string
  password: string
}

export interface Registration {
  username: string
  email: string
  password: string
}

export const login = (body: Credentials) =>
  api<TokenResponse>('/auth/login', { method: 'POST', body })

export const register = (body: Registration) =>
  api<TokenResponse>('/auth/register', { method: 'POST', body })

export const logout = () => api<void>('/auth/logout', { method: 'POST' })

export const getMe = () => api<Me>('/me')
