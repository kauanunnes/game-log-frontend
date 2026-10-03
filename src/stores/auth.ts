import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import * as authApi from '@/api/auth'
import { refreshSession, setAccessToken } from '@/api/client'
import { queryClient } from '@/api/queryClient'
import type { Me, TokenResponse } from '@/types/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<Me | null>(null)
  const isLoggedIn = computed(() => user.value !== null)

  async function start({ accessToken }: TokenResponse) {
    setAccessToken(accessToken)
    user.value = await authApi.getMe()
  }

  const login = async (credentials: authApi.Credentials) => start(await authApi.login(credentials))
  const register = async (data: authApi.Registration) => start(await authApi.register(data))

  async function restore() {
    if (await refreshSession()) user.value = await authApi.getMe().catch(() => null)
  }

  async function logout() {
    await authApi.logout().catch(() => undefined)
    setAccessToken(null)
    user.value = null
    // Os dados da conta não podem sobrar para quem entrar depois no mesmo navegador.
    queryClient.removeQueries({ queryKey: ['me'] })
  }

  return { user, isLoggedIn, login, register, restore, logout }
})
