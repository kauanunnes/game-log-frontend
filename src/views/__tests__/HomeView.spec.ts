import { mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { GameSummary, Page, PublicReview } from '@/types/api'
import HomeView from '../HomeView.vue'

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } })

const page = <T>(content: T[]): Page<T> => ({
  content,
  page: { size: 12, number: 0, totalElements: content.length, totalPages: 1 },
})

const hades: GameSummary = {
  id: 1,
  slug: 'hades',
  title: 'Hades',
  coverUrl: null,
  releaseYear: 2020,
}
const celeste: GameSummary = {
  id: 2,
  slug: 'celeste',
  title: 'Celeste',
  coverUrl: null,
  releaseYear: 2018,
}

const review: PublicReview = {
  id: 1,
  user: { username: 'ana', displayName: 'Ana' },
  game: celeste,
  status: 'PLAYED',
  rating: 4.5,
  recommends: true,
  text: 'Difícil e justo.',
  hasSpoilers: false,
  reviewedAt: '2026-10-02T12:00:00Z',
  likes: 3,
}

/** Responde pelo caminho com a query; o resto recebe uma página vazia. */
function stubApi(routes: Record<string, unknown> = {}) {
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof globalThis.fetch>(async (input) => json(routes[String(input)] ?? page([]))),
  )
}

async function mountHome() {
  const blank = { render: () => null }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: HomeView },
      { path: '/games', name: 'explore', component: blank },
      { path: '/games/:slug', name: 'game', component: blank },
      { path: '/signup', name: 'signup', component: blank },
      { path: '/login', name: 'login', component: blank },
      { path: '/u/:username', name: 'profile', component: blank },
      { path: '/u/:username/playing', name: 'profile-playing', component: blank },
    ],
  })
  await router.push('/')
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const App = { template: '<RouterView />' }
  return mount(App, { global: { plugins: [router, [VueQueryPlugin, { queryClient }]] } })
}

describe('HomeView', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => vi.unstubAllGlobals())

  it('mostra os jogos em alta e as avaliações recentes', async () => {
    stubApi({
      '/api/v1/games?sort=trending&size=12': page([hades, celeste]),
      '/api/v1/reviews?size=5': page([review]),
    })
    const wrapper = await mountHome()

    await vi.waitFor(() => expect(wrapper.findAll('.card')).toHaveLength(2))
    await vi.waitFor(() => expect(wrapper.find('.feed').text()).toContain('Difícil e justo.'))
    expect(wrapper.find('.feed .title').text()).toBe('Celeste')
    expect(wrapper.find('.feed .meta').text()).toContain('Ana')
    expect(wrapper.find('.feed .like').text()).toContain('3 curtidas')
    expect(wrapper.find('a.more').attributes('href')).toBe('/games?sort=trending')
  })

  it('sem avaliações, convida a escrever a primeira', async () => {
    stubApi()
    const wrapper = await mountHome()

    await vi.waitFor(() => expect(wrapper.text()).toContain('Ninguém avaliou um jogo ainda.'))
  })

  it('com sessão, troca "Criar conta" pelo atalho de Jogando', async () => {
    stubApi()
    useAuthStore().user = {
      id: 1,
      username: 'ana',
      email: 'ana@example.com',
      displayName: 'Ana',
      bio: null,
      gender: null,
    }
    const wrapper = await mountHome()

    const links = wrapper.findAll('.hero a').map((link) => link.attributes('href'))
    expect(links).toEqual(['/games', '/u/ana/playing'])
  })
})
