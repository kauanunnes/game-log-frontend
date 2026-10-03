import { flushPromises, mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import ExploreView from '../ExploreView.vue'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const page = (...titles: string[]) => ({
  content: titles.map((title, i) => ({
    id: i + 1,
    slug: `jogo-${i + 1}`,
    title,
    coverUrl: null,
    releaseYear: 2020,
  })),
  page: { size: 24, number: 0, totalElements: titles.length, totalPages: 1 },
})

/** Gêneros e plataformas fixos; `/games` responde com `games`. */
function mockApi(games: () => Response) {
  const fetch = vi.fn<typeof globalThis.fetch>(async (input) => {
    const path = String(input)
    if (path === '/api/v1/genres') return json([{ id: 2, name: 'Adventure', slug: 'adventure' }])
    if (path === '/api/v1/platforms') return json([{ id: 8, name: 'Switch', slug: 'switch' }])
    return games()
  })
  vi.stubGlobal('fetch', fetch)
  return fetch
}

async function mountAt(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/games', name: 'explore', component: ExploreView },
      { path: '/games/:slug', name: 'game', component: { render: () => null } },
    ],
  })
  await router.push(path)
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = mount(ExploreView, {
    global: { plugins: [router, [VueQueryPlugin, { queryClient }]] },
  })
  return { wrapper, router }
}

describe('ExploreView', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('busca com os filtros da URL e mostra os jogos', async () => {
    const fetch = mockApi(() => json(page('Hollow Knight', 'Celeste')))
    const { wrapper } = await mountAt('/games?q=knight&genre=2&page=2')

    await vi.waitFor(() => expect(wrapper.text()).toContain('Hollow Knight'))
    const games = fetch.mock.calls
      .map(([input]) => String(input))
      .find((path) => path.includes('?'))
    expect(games).toBe('/api/v1/games?q=knight&genreId=2&page=1&size=24')
    expect(wrapper.text()).toContain('2 jogos')
  })

  it('leva a busca e os filtros para a URL', async () => {
    mockApi(() => json(page('Hades')))
    const { wrapper, router } = await mountAt('/games')
    await vi.waitFor(() => expect(wrapper.text()).toContain('Adventure'))

    await wrapper.find('input[type=search]').setValue('hades')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(router.currentRoute.value.query).toEqual({ q: 'hades' })

    await wrapper.find('select').setValue('2')
    await flushPromises()
    expect(router.currentRoute.value.query).toEqual({ q: 'hades', genre: '2' })
  })

  it('mostra o erro e tenta de novo', async () => {
    const responses = [json({ title: 'Erro', status: 500 }, 500), json(page('Celeste'))]
    mockApi(() => responses.shift() ?? json(page()))
    const { wrapper } = await mountAt('/games')

    await vi.waitFor(() => expect(wrapper.find('[role=alert]').exists()).toBe(true))
    await wrapper.find('[role=alert] button').trigger('click')
    await vi.waitFor(() => expect(wrapper.text()).toContain('Celeste'))
  })

  it('avisa quando não encontra nada', async () => {
    mockApi(() => json(page()))
    const { wrapper } = await mountAt('/games?q=xyz')

    await vi.waitFor(() => expect(wrapper.text()).toContain('Nenhum jogo encontrado para xyz'))
    expect(wrapper.find('a.button').text()).toBe('Limpar filtros')
  })
})
