import { mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { Activity, GameSummary } from '@/types/api'
import FeedView from '../FeedView.vue'

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } })

const page = (content: Activity[]) => ({
  content,
  page: { size: 20, number: 0, totalElements: content.length, totalPages: 1 },
})

const game = (slug: string, title: string): GameSummary => ({
  id: slug.length,
  slug,
  title,
  coverUrl: null,
  releaseYear: null,
})

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString()
const bia = { username: 'bia', displayName: 'Bia' }

const activities: Activity[] = [
  {
    id: 3,
    type: 'REVIEW',
    user: bia,
    game: game('celeste', 'Celeste'),
    status: 'PLAYED',
    review: { rating: 4.5, recommends: true, text: 'Final emocionante.', hasSpoilers: true },
    createdAt: ago(5),
  },
  {
    id: 2,
    type: 'STATUS',
    user: bia,
    game: game('hollow-knight', 'Hollow Knight'),
    status: 'PLAYED',
    completed: true,
    createdAt: ago(120),
  },
  {
    id: 1,
    type: 'STATUS',
    user: { username: 'caio', displayName: null },
    game: game('hades', 'Hades'),
    status: 'WISHLIST',
    completed: false,
    createdAt: ago(60 * 24),
  },
]

let requests: string[]

function stubApi(body: unknown) {
  requests = []
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof globalThis.fetch>(async (input) => {
      requests.push(String(input))
      return json(body)
    }),
  )
}

async function mountFeed() {
  const blank = { render: () => null }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: blank },
      { path: '/feed', name: 'feed', component: FeedView },
      { path: '/games/:slug', name: 'game', component: blank },
      { path: '/u/:username', name: 'profile', component: blank },
    ],
  })
  await router.push('/feed')
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const App = { template: '<RouterView />' }
  return mount(App, { global: { plugins: [router, [VueQueryPlugin, { queryClient }]] } })
}

const items = (wrapper: Awaited<ReturnType<typeof mountFeed>>) =>
  wrapper.findAll('.activities > li').map((item) => item.text().replace(/\s+/g, ' '))

describe('FeedView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    useAuthStore().user = {
      id: 1,
      username: 'ana',
      email: 'ana@example.com',
      displayName: 'Ana',
      bio: null,
      gender: null,
    }
  })

  afterEach(() => vi.unstubAllGlobals())

  it('conta o que cada pessoa fez, com o tempo relativo', async () => {
    stubApi(page(activities))
    const wrapper = await mountFeed()

    await vi.waitFor(() => expect(items(wrapper)).toHaveLength(3))
    const [review, completed, wishlist] = items(wrapper)
    expect(review).toContain('Bia avaliou Celeste · há 5 minutos')
    expect(completed).toContain('Bia zerou Hollow Knight · há 2 horas')
    expect(wishlist).toContain('caio adicionou Hades à lista de desejos · ontem')
    expect(requests).toContain('/api/v1/me/feed?page=0&size=20')
  })

  it('esconde o spoiler da avaliação até o clique', async () => {
    stubApi(page(activities.slice(0, 1)))
    const wrapper = await mountFeed()

    await vi.waitFor(() => expect(wrapper.find('.spoiler').exists()).toBe(true))
    expect(wrapper.text()).not.toContain('Final emocionante.')
    expect(wrapper.text()).toContain('Recomenda')

    await wrapper.find('.spoiler').trigger('click')
    expect(wrapper.text()).toContain('Final emocionante.')
  })

  it('sem atividade, sugere as avaliações recentes', async () => {
    stubApi(page([]))
    const wrapper = await mountFeed()

    await vi.waitFor(() => expect(wrapper.text()).toContain('Nada por aqui ainda.'))
    expect(wrapper.find('.empty a').attributes('href')).toBe('/')
  })
})
