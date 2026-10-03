import { mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { GameDetails } from '@/types/api'
import GameView from '../GameView.vue'

const hollowKnight: GameDetails = {
  id: 2,
  slug: 'hollow-knight',
  title: 'Hollow Knight',
  summary: 'Um cavaleiro explora Hallownest.',
  releaseDate: '2017-02-24',
  kind: 'MAIN',
  coverUrl: null,
  genres: [{ id: 2, name: 'Adventure', slug: 'adventure' }],
  platforms: [{ id: 8, name: 'Nintendo Switch', abbreviation: 'Switch', slug: 'switch' }],
  developers: ['Team Cherry'],
  publishers: ['Team Cherry'],
  franchises: [],
  themes: ['Fantasy'],
  modes: [],
  perspectives: [],
  igdbRating: 90,
  igdbRatingCount: 2100,
}

function mountGame(response: Response) {
  vi.stubGlobal('fetch', vi.fn<typeof globalThis.fetch>().mockResolvedValue(response))
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/games', name: 'explore', component: { render: () => null } },
      { path: '/games/:slug', name: 'game', component: GameView, props: true },
    ],
  })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return mount(GameView, {
    props: { slug: 'hollow-knight' },
    global: { plugins: [router, [VueQueryPlugin, { queryClient }]] },
  })
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('GameView', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('mostra os dados do jogo e liga os gêneros à busca', async () => {
    const wrapper = mountGame(json(hollowKnight))

    await vi.waitFor(() => expect(wrapper.find('h2').text()).toBe('Hollow Knight'))
    expect(wrapper.text()).toContain('24 de fevereiro de 2017')
    expect(wrapper.text()).toContain('por Team Cherry')
    expect(wrapper.find('.display').text()).toBe('90')
    expect(wrapper.find('[aria-label=Gêneros] a').attributes('href')).toBe('/games?genre=2')
    expect(wrapper.find('dl').text()).toContain('Fantasy')
  })

  it('avisa quando o jogo não existe', async () => {
    const wrapper = mountGame(json({ title: 'Não encontrado', status: 404 }, 404))

    await vi.waitFor(() => expect(wrapper.text()).toContain('Não existe jogo no endereço'))
  })
})
