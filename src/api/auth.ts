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

export const verifyEmail = (token: string) =>
  api<void>('/auth/email/verify', { method: 'POST', body: { token } })

/** Responde igual exista a conta ou não. */
export const forgotPassword = (email: string) =>
  api<void>('/auth/password/forgot', { method: 'POST', body: { email } })

/** Encerra todas as sessões da conta. */
export const resetPassword = (token: string, newPassword: string) =>
  api<void>('/auth/password/reset', { method: 'POST', body: { token, newPassword } })
