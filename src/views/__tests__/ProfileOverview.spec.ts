import { flushPromises, mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { GameSummary } from '@/types/api'
import ProfileOverview from '../profile/ProfileOverview.vue'

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } })

const game = (id: number, slug: string, title: string): GameSummary => ({
  id,
  slug,
  title,
  coverUrl: null,
  releaseYear: 2018,
})
const celeste = game(1, 'celeste', 'Celeste')
const hollow = game(2, 'hollow-knight', 'Hollow Knight')

const page = (content: unknown[]) => ({
  content,
  page: { size: 50, number: 0, totalElements: content.length, totalPages: 1 },
})
const stats = { total: 2, hoursPlayed: 10, byStatus: {}, ratingDistribution: [] }
const entry = (gameSummary: GameSummary) => ({
  game: gameSummary,
  status: 'PLAYED',
  favorite: true,
  review: null,
  playthrough: null,
  acquisition: null,
  createdAt: '2026-10-01T10:00:00Z',
  updatedAt: '2026-10-01T10:00:00Z',
})

let calls: { method: string; url: string; body?: unknown }[]

function stubApi(header: unknown) {
  calls = []
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof globalThis.fetch>(async (input, init) => {
      const method = init?.method ?? 'GET'
      const url = String(input)
      calls.push({ method, url, body: init?.body && JSON.parse(String(init.body)) })
      if (method === 'PUT') return json([hollow, celeste])
      if (url.startsWith('/api/v1/me/profile') || url === '/api/v1/users/ana') return json(header)
      if (url.includes('/stats')) return json(stats)
      if (url.includes('favorite=true&size=50')) return json(page([entry(celeste), entry(hollow)]))
      return json(page([]))
    }),
  )
}

async function mountOverview() {
  const blank = { render: () => null }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/u/:username', name: 'profile', component: ProfileOverview },
      { path: '/games', name: 'explore', component: blank },
      { path: '/games/:slug', name: 'game', component: blank },
      { path: '/u/:username/favorites', name: 'profile-favorites', component: blank },
      { path: '/u/:username/playing', name: 'profile-playing', component: blank },
    ],
  })
  await router.push('/u/ana')
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const App = { template: '<RouterView />' }
  return mount(App, { global: { plugins: [router, [VueQueryPlugin, { queryClient }]] } })
}

describe('ProfileOverview', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => vi.unstubAllGlobals())

  it('mostra os destaques na ordem escolhida', async () => {
    stubApi({ username: 'ana', displayName: 'Ana', private: false, featured: [hollow, celeste] })
    const wrapper = await mountOverview()

    await vi.waitFor(() => expect(wrapper.find('.featured').exists()).toBe(true))
    expect(wrapper.findAll('.featured .title').map((title) => title.text())).toEqual([
      'Hollow Knight',
      'Celeste',
    ])
    expect(wrapper.find('.choose').exists()).toBe(false)
  })

  it('a dona escolhe e ordena os destaques', async () => {
    useAuthStore().user = {
      id: 1,
      username: 'ana',
      email: 'ana@example.com',
      displayName: 'Ana',
      bio: null,
      gender: null,
    }
    stubApi({ username: 'ana', displayName: 'Ana', private: false, featured: [] })
    const wrapper = await mountOverview()
    await vi.waitFor(() => expect(wrapper.find('.choose').exists()).toBe(true))

    await wrapper.find('.choose').trigger('click')
    await vi.waitFor(() =>
      expect(wrapper.findAll('form.editor button').some((b) => b.text() === 'Destacar')).toBe(true),
    )
    for (const button of wrapper
      .findAll('form.editor button')
      .filter((b) => b.text() === 'Destacar')) {
      await button.trigger('click')
    }
    await wrapper.find('[aria-label="Subir Hollow Knight"]').trigger('click')
    await wrapper.find('form.editor').trigger('submit')
    await flushPromises()

    expect(calls).toContainEqual({
      method: 'PUT',
      url: '/api/v1/me/library/featured',
      body: { gameIds: [2, 1] },
    })
  })
})
