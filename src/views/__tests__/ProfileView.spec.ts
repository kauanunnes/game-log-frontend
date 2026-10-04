import { mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { Me, Profile, ProfileCounts } from '@/types/api'
import ProfileView from '../ProfileView.vue'
import ProfileFollowsTab from '../profile/ProfileFollowsTab.vue'
import ProfileLibraryTab from '../profile/ProfileLibraryTab.vue'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const counts: ProfileCounts = {
  played: 12,
  playing: 2,
  backlog: 5,
  wishlist: 7,
  dropped: 1,
  favorites: 3,
  reviews: 4,
  followers: 2,
  following: 1,
}

const ana: Profile = {
  username: 'ana',
  displayName: 'Ana',
  private: false,
  bio: 'Metroidvanias.',
  gender: 'FEMALE',
  memberSince: '2026-09-01',
  counts,
}

const emptyPage = { content: [], page: { size: 24, number: 0, totalElements: 0, totalPages: 0 } }
const noContent = () => new Response(null, { status: 204 })

let requests: string[]

/** Responde pelo caminho sem a query; um método que não seja GET entra na chave: "PUT /api/...". */
function stubApi(routes: Record<string, unknown>) {
  requests = []
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof globalThis.fetch>(async (input, init) => {
      const path = String(input)
      const method = init?.method ?? 'GET'
      const call = method === 'GET' ? path : `${method} ${path}`
      requests.push(call)
      const route = routes[call.split('?')[0] ?? '']
      if (typeof route === 'function') return route()
      return json(route ?? emptyPage)
    }),
  )
}

function logIn(user: Pick<Me, 'id' | 'username'>) {
  useAuthStore().user = {
    email: `${user.username}@example.com`,
    displayName: null,
    bio: null,
    gender: null,
    ...user,
  }
}

async function mountAt(path: string) {
  const blank = { render: () => null }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', name: 'login', component: blank },
      { path: '/games', name: 'explore', component: blank },
      { path: '/games/:slug', name: 'game', component: blank },
      {
        path: '/u/:username',
        component: ProfileView,
        props: true,
        children: [
          { path: '', name: 'profile', component: blank },
          {
            path: 'played',
            name: 'profile-played',
            component: ProfileLibraryTab,
            props: { statuses: ['PLAYED', 'DROPPED'], variants: true },
          },
          { path: 'playing', name: 'profile-playing', component: blank },
          { path: 'backlog', name: 'profile-backlog', component: blank },
          { path: 'wishlist', name: 'profile-wishlist', component: blank },
          { path: 'favorites', name: 'profile-favorites', component: blank },
          { path: 'reviews', name: 'profile-reviews', component: blank },
          { path: 'stats', name: 'profile-stats', component: blank },
          {
            path: 'followers',
            name: 'profile-followers',
            component: ProfileFollowsTab,
            props: { list: 'followers' },
          },
          {
            path: 'following',
            name: 'profile-following',
            component: ProfileFollowsTab,
            props: { list: 'following' },
          },
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
    stubApi({ '/api/v1/users/ana': ana })
    const wrapper = await mountAt('/u/ana')

    await vi.waitFor(() => expect(wrapper.find('h2').text()).toBe('Ana'))
    expect(wrapper.text()).toContain('@ana · Feminino')
    expect(wrapper.text()).toContain('Membro desde 1 de setembro de 2026')
    expect(wrapper.find('.counters').text()).toContain('Jogados12')
    expect(wrapper.find('.follows').text()).toContain('2 seguidores')
    expect(wrapper.find('.follows').text()).toContain('1 seguindo')
    expect(wrapper.findAll('.follows a').map((link) => link.attributes('href'))).toEqual([
      '/u/ana/followers',
      '/u/ana/following',
    ])
    expect(wrapper.find('.follow a').attributes('href')).toMatch(/^\/login\?redirect=/)
    expect(wrapper.find('.tabs').exists()).toBe(true)
  })

  it('num perfil privado, quem visita vê só o cabeçalho', async () => {
    stubApi({ '/api/v1/users/bia': { username: 'bia', displayName: 'Bia', private: true } })
    const wrapper = await mountAt('/u/bia')

    await vi.waitFor(() => expect(wrapper.text()).toContain('Este perfil é privado.'))
    expect(wrapper.find('.tabs').exists()).toBe(false)
    expect(wrapper.find('.counters').exists()).toBe(false)
    expect(wrapper.find('.follow').exists()).toBe(true)
  })

  it('com sessão, segue e deixa de seguir', async () => {
    stubApi({
      '/api/v1/users/ana': ana,
      '/api/v1/users/ana/follow': () => json({ status: 404, title: 'Não encontrado' }, 404),
      'PUT /api/v1/users/ana/follow': noContent,
      'DELETE /api/v1/users/ana/follow': noContent,
    })
    logIn({ id: 2, username: 'bia' })
    const wrapper = await mountAt('/u/ana')
    const button = () => wrapper.find('.follow button')

    await vi.waitFor(() => expect(button().attributes('disabled')).toBeUndefined())
    expect(button().text()).toBe('Seguir')
    expect(button().attributes('aria-pressed')).toBe('false')

    await button().trigger('click')
    await vi.waitFor(() => expect(button().text()).toBe('Seguindo'))
    expect(button().attributes('aria-pressed')).toBe('true')

    await button().trigger('click')
    await vi.waitFor(() => expect(button().text()).toBe('Seguir'))
    expect(requests).toContain('PUT /api/v1/users/ana/follow')
    expect(requests).toContain('DELETE /api/v1/users/ana/follow')
  })

  it('o dono usa /me/profile e vê as abas mesmo com o perfil privado', async () => {
    stubApi({
      '/api/v1/me/profile': { ...ana, username: 'caio', displayName: 'Caio', private: true },
    })
    logIn({ id: 3, username: 'caio' })
    const wrapper = await mountAt('/u/caio')

    await vi.waitFor(() => expect(wrapper.find('.counters').text()).toContain('Favoritos3'))
    expect(wrapper.text()).toContain('Seu perfil está privado: só você vê as abas.')
    expect(wrapper.find('.tabs').exists()).toBe(true)
    expect(wrapper.find('.follow').exists()).toBe(false)
    expect(requests.some((path) => path.startsWith('/api/v1/users/'))).toBe(false)
  })

  it('lista quem segue a pessoa', async () => {
    stubApi({
      '/api/v1/users/ana': ana,
      '/api/v1/users/ana/followers': {
        content: [{ username: 'bia', displayName: 'Bia', followedAt: '2026-10-01T10:00:00Z' }],
        page: { size: 30, number: 0, totalElements: 1, totalPages: 1 },
      },
    })
    const wrapper = await mountAt('/u/ana/followers')

    await vi.waitFor(() => expect(wrapper.find('.people').text()).toContain('Bia'))
    expect(wrapper.find('.people').text()).toContain('@bia')
    expect(wrapper.find('.people').text()).toContain('desde 1 de outubro de 2026')
    expect(requests).toContain('/api/v1/users/ana/followers?page=0&size=30')
  })

  it('o dono vê a própria lista de seguidos, mesmo vazia', async () => {
    stubApi({ '/api/v1/me/profile': { ...ana, username: 'caio' } })
    logIn({ id: 3, username: 'caio' })
    const wrapper = await mountAt('/u/caio/following')

    await vi.waitFor(() => expect(wrapper.text()).toContain('Você ainda não segue ninguém.'))
    expect(requests).toContain('/api/v1/me/following?page=0&size=30')
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
