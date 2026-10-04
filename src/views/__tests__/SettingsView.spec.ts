import { flushPromises, mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { Me } from '@/types/api'
import SettingsView from '../SettingsView.vue'
import SettingsAccountTab from '../settings/SettingsAccountTab.vue'
import SettingsDataTab from '../settings/SettingsDataTab.vue'
import SettingsPrivacyTab from '../settings/SettingsPrivacyTab.vue'
import SettingsProfileTab from '../settings/SettingsProfileTab.vue'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const ana: Me = {
  id: 1,
  username: 'ana',
  email: 'ana@example.com',
  displayName: 'Ana',
  bio: null,
  gender: null,
  profileVisibility: 'PUBLIC',
  showSpending: false,
  defaultCurrency: 'BRL',
  createdAt: '2026-09-01T12:00:00Z',
}

let calls: { method: string; path: string; body: unknown }[]

/** Responde pelo "MÉTODO caminho"; o que não estiver no mapa recebe 204. */
function stubApi(responses: Record<string, () => Response> = {}) {
  calls = []
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof globalThis.fetch>(async (input, init) => {
      const method = init?.method ?? 'GET'
      const path = String(input)
      calls.push({ method, path, body: init?.body ? JSON.parse(String(init.body)) : undefined })
      return responses[`${method} ${path}`]?.() ?? new Response(null, { status: 204 })
    }),
  )
}

async function mountAt(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { render: () => null } },
      {
        path: '/settings',
        component: SettingsView,
        children: [
          { path: 'profile', name: 'settings', component: SettingsProfileTab },
          { path: 'account', name: 'settings-account', component: SettingsAccountTab },
          { path: 'privacy', name: 'settings-privacy', component: SettingsPrivacyTab },
          { path: 'data', name: 'settings-data', component: SettingsDataTab },
        ],
      },
    ],
  })
  await router.push(path)
  const queryClient = new QueryClient()
  const App = { template: '<RouterView />' }
  const wrapper = mount(App, { global: { plugins: [router, [VueQueryPlugin, { queryClient }]] } })
  return { wrapper, router }
}

type Wrapper = Awaited<ReturnType<typeof mountAt>>['wrapper']

async function typePasswords(wrapper: Wrapper, ...values: string[]) {
  const inputs = wrapper.findAll('input[type="password"]')
  for (const [index, value] of values.entries()) await inputs[index]?.setValue(value)
}

async function submit(wrapper: Wrapper) {
  await wrapper.find('form').trigger('submit')
  await flushPromises()
}

describe('SettingsView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    useAuthStore().user = { ...ana }
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('Perfil envia só o que mudou, com o campo vazio como null', async () => {
    stubApi({
      'PATCH /api/v1/me': () => json({ ...ana, displayName: null, bio: 'Metroidvanias.' }),
    })
    const { wrapper } = await mountAt('/settings/profile')

    await wrapper.find('input').setValue('')
    await wrapper.find('textarea').setValue('Metroidvanias.')
    await submit(wrapper)

    expect(calls).toEqual([
      {
        method: 'PATCH',
        path: '/api/v1/me',
        body: { displayName: null, bio: 'Metroidvanias.' },
      },
    ])
    expect(useAuthStore().user?.bio).toBe('Metroidvanias.')
    expect(wrapper.text()).toContain('Alterações salvas.')
    expect(wrapper.find('button[type="submit"]').attributes()).toHaveProperty('disabled')
  })

  it('Conta não chama a API se a confirmação for diferente', async () => {
    stubApi()
    const { wrapper } = await mountAt('/settings/account')

    await typePasswords(wrapper, 'senha-antiga', 'senha-nova-1', 'senha-nova-2')
    await submit(wrapper)

    expect(calls).toEqual([])
    expect(wrapper.find('[role="alert"]').text()).toBe('A confirmação não é igual à nova senha.')
  })

  it('Conta troca a senha e entra de novo com a nova', async () => {
    stubApi({
      'POST /api/v1/auth/login': () => json({ accessToken: 'token', expiresIn: 900 }),
      'GET /api/v1/me': () => json(ana),
    })
    const { wrapper } = await mountAt('/settings/account')

    await typePasswords(wrapper, 'senha-antiga', 'senha-nova-1', 'senha-nova-1')
    await submit(wrapper)

    expect(calls).toEqual([
      {
        method: 'PUT',
        path: '/api/v1/me/password',
        body: { currentPassword: 'senha-antiga', newPassword: 'senha-nova-1' },
      },
      {
        method: 'POST',
        path: '/api/v1/auth/login',
        body: { login: 'ana', password: 'senha-nova-1' },
      },
      { method: 'GET', path: '/api/v1/me', body: undefined },
    ])
    expect(wrapper.text()).toContain('Senha alterada.')
  })

  it('Privacidade envia as três opções', async () => {
    stubApi({
      'PATCH /api/v1/me/settings': () => json({ ...ana, profileVisibility: 'PRIVATE' }),
    })
    const { wrapper } = await mountAt('/settings/privacy')

    await wrapper.find('input[type="checkbox"]').setValue(true)
    await submit(wrapper)

    expect(calls[0]?.body).toEqual({
      profileVisibility: 'PRIVATE',
      showSpending: false,
      defaultCurrency: 'BRL',
    })
    expect(useAuthStore().user?.profileVisibility).toBe('PRIVATE')
    expect(wrapper.text()).toContain('Alterações salvas.')
  })

  it('Dados baixa a exportação num arquivo JSON', async () => {
    const data = { exportedAt: '2026-10-04T20:00:00Z', account: ana, library: [] }
    stubApi({ 'GET /api/v1/me/export': () => json(data) })
    // O jsdom não cria links de arquivo nem baixa nada.
    const files: Blob[] = []
    URL.createObjectURL = (file: Blob) => (files.push(file), 'blob:exportacao')
    URL.revokeObjectURL = vi.fn<(url: string) => void>()
    let fileName = ''
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      fileName = this.download
    })
    const { wrapper } = await mountAt('/settings/data')

    await wrapper.find('button[type="button"]').trigger('click')
    await flushPromises()

    expect(calls.map(({ method, path }) => `${method} ${path}`)).toEqual(['GET /api/v1/me/export'])
    expect(fileName).toBe('game-log-ana-2026-10-04.json')
    expect(JSON.parse(await files[0]!.text())).toEqual(data)
    expect(wrapper.find('[role="status"]').text()).toContain('Confira seus downloads')

    wrapper.unmount()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:exportacao')
  })

  it('Dados exclui a conta só depois de confirmar e volta ao início', async () => {
    stubApi()
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    const { wrapper, router } = await mountAt('/settings/data')

    await typePasswords(wrapper, 'minha-senha')
    await submit(wrapper)
    expect(calls).toEqual([])

    await submit(wrapper)

    expect(calls.map(({ method, path }) => `${method} ${path}`)).toEqual([
      'DELETE /api/v1/me',
      'POST /api/v1/auth/logout',
    ])
    expect(calls[0]?.body).toEqual({ password: 'minha-senha' })
    expect(useAuthStore().user).toBeNull()
    expect(router.currentRoute.value.name).toBe('home')
  })

  it('Dados mostra a senha incorreta e mantém a sessão', async () => {
    const wrong = { status: 422, errors: [{ field: 'password', message: 'senha incorreta' }] }
    stubApi({ 'DELETE /api/v1/me': () => json(wrong, 422) })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { wrapper } = await mountAt('/settings/data')

    await typePasswords(wrapper, 'errada')
    await submit(wrapper)

    expect(wrapper.find('[role="alert"]').text()).toBe('senha incorreta')
    expect(useAuthStore().user).not.toBeNull()
  })
})
