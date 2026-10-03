import { mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { LibraryCounts, Profile } from '@/types/api'
import ProfileView from '../ProfileView.vue'
import ProfileLibraryTab from '../profile/ProfileLibraryTab.vue'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const counts: LibraryCounts = {
  played: 12,
  playing: 2,
  backlog: 5,
  wishlist: 7,
  dropped: 1,
  favorites: 3,
  reviews: 4,
}

const emptyPage = { content: [], page: { size: 24, number: 0, totalElements: 0, totalPages: 0 } }

let requests: string[]

function stubApi(routes: Record<string, unknown>) {
  requests = []
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof globalThis.fetch>(async (input) => {
      const path = String(input)
      requests.push(path)
      const route = routes[path.split('?')[0] ?? '']
      return json(route ?? emptyPage)
    }),
  )
}

async function mountAt(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/games', name: 'explore', component: { render: () => null } },
      { path: '/games/:slug', name: 'game', component: { render: () => null } },
      {
        path: '/u/:username',
        component: ProfileView,
        props: true,
        children: [
          { path: '', name: 'profile', component: { render: () => null } },
          {
            path: 'played',
            name: 'profile-played',
            component: ProfileLibraryTab,
            props: { statuses: ['PLAYED', 'DROPPED'], variants: true },
          },
          { path: 'playing', name: 'profile-playing', component: { render: () => null } },
          { path: 'backlog', name: 'profile-backlog', component: { render: () => null } },
          { path: 'wishlist', name: 'profile-wishlist', component: { render: () => null } },
          { path: 'favorites', name: 'profile-favorites', component: { render: () => null } },
          { path: 'reviews', name: 'profile-reviews', component: { render: () => null } },
          { path: 'stats', name: 'profile-stats', component: { render: () => null } },
        ],
      },
    ],
  })
  await router.push(path)
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const App = { template: '<RouterView />' }
  return mount(App, { global: { plugins: [router, [VueQueryPlugin, { queryClient }]] } })
}

describe('ProfileView', () => {
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
      this.setAttribute('open', '')
    }
  })

  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => vi.unstubAllGlobals())

  it('mostra o cabeçalho público com os contadores', async () => {
    const ana: Profile = {
      username: 'ana',
      displayName: 'Ana',
      private: false,
      bio: 'Metroidvanias.',
      gender: 'FEMALE',
      memberSince: '2026-09-01',
      counts,
    }
    stubApi({ '/api/v1/users/ana': ana })
    const wrapper = await mountAt('/u/ana')

    await vi.waitFor(() => expect(wrapper.find('h2').text()).toBe('Ana'))
    expect(wrapper.text()).toContain('@ana · Feminino')
    expect(wrapper.text()).toContain('Membro desde 1 de setembro de 2026')
    expect(wrapper.find('.counters').text()).toContain('Jogados12')
    expect(wrapper.find('.tabs').exists()).toBe(true)
  })

  it('num perfil privado, quem visita vê só o cabeçalho', async () => {
    stubApi({ '/api/v1/users/bia': { username: 'bia', displayName: 'Bia', private: true } })
    const wrapper = await mountAt('/u/bia')

    await vi.waitFor(() => expect(wrapper.text()).toContain('Este perfil é privado.'))
    expect(wrapper.find('.tabs').exists()).toBe(false)
    expect(wrapper.find('.counters').exists()).toBe(false)
  })

  it('o dono usa os próprios dados e vê as abas mesmo com o perfil privado', async () => {
    stubApi({ '/api/v1/me/library/counts': counts })
    useAuthStore().user = {
      id: 3,
      username: 'caio',
      email: 'caio@example.com',
      displayName: 'Caio',
      bio: null,
      gender: null,
      profileVisibility: 'PRIVATE',
      createdAt: '2026-09-15T12:00:00Z',
    }
    const wrapper = await mountAt('/u/caio')

    await vi.waitFor(() => expect(wrapper.find('.counters').text()).toContain('Favoritos3'))
    expect(wrapper.text()).toContain('Seu perfil está privado: só você vê as abas.')
    expect(wrapper.find('.tabs').exists()).toBe(true)
    expect(requests.some((path) => path.startsWith('/api/v1/users/'))).toBe(false)
  })

  it('a aba Jogados filtra "Zerados" pela API', async () => {
    stubApi({ '/api/v1/users/ana': { username: 'ana', displayName: null, private: false } })
    await mountAt('/u/ana/played?filtro=zerados')

    await vi.waitFor(() =>
      expect(requests).toContain(
        '/api/v1/users/ana/library?status=PLAYED&completed=true&sort=updatedAt%2Cdesc&page=0&size=24',
      ),
    )
  })
})
