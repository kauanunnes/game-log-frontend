import { mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { Recommendations } from '@/types/api'
import ForYouView from '../ForYouView.vue'

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } })

const game = (id: number, title: string) => ({
  id,
  slug: title.toLowerCase(),
  title,
  coverUrl: null,
  releaseYear: 2020,
})

async function mountWith(recommendations: Recommendations) {
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof globalThis.fetch>(async () => json(recommendations)),
  )
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/for-you', name: 'for-you', component: ForYouView },
      { path: '/games/:slug', name: 'game', component: { render: () => null } },
    ],
  })
  await router.push('/for-you')
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return mount(ForYouView, {
    global: { plugins: [router, [VueQueryPlugin, { queryClient }]] },
  })
}

describe('ForYouView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    useAuthStore().user = {
      id: 1,
      username: 'ana',
      email: 'ana@example.com',
      displayName: null,
      bio: null,
      gender: null,
    }
  })
  afterEach(() => vi.unstubAllGlobals())

  it('mostra cada sugestão com o motivo', async () => {
    const wrapper = await mountWith({
      suggestions: [
        { game: game(1, 'Ori'), reason: 'Parecido com Hollow Knight, que você favoritou.' },
        { game: game(2, 'Celeste'), reason: 'Parecido com Hades, que você recomenda.' },
      ],
      personalized: true,
    })

    await vi.waitFor(() => expect(wrapper.findAll('.reason')).toHaveLength(2))
    expect(wrapper.findAll('.title').map((title) => title.text())).toEqual(['Ori', 'Celeste'])
    expect(wrapper.find('.reason').text()).toBe('Parecido com Hollow Knight, que você favoritou.')
    expect(wrapper.text()).toContain('fora os que já estão na sua biblioteca')
  })

  it('sem sinais na biblioteca, explica que são os populares', async () => {
    const wrapper = await mountWith({
      suggestions: [{ game: game(3, 'Portal'), reason: 'Entre os mais populares do IGDB.' }],
      personalized: false,
    })

    await vi.waitFor(() => expect(wrapper.find('.reason').exists()).toBe(true))
    expect(wrapper.text()).toContain('Ainda não sabemos do que você gosta')
  })
})
