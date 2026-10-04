import { flushPromises, mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { GameList, GameSummary, ListSummary } from '@/types/api'
import ListView from '../ListView.vue'
import ProfileListsTab from '../profile/ProfileListsTab.vue'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const game = (id: number, slug: string, title: string): GameSummary => ({
  id,
  slug,
  title,
  coverUrl: null,
  releaseYear: 2018,
})

const list: GameList = {
  id: 7,
  title: 'Top metroidvanias',
  description: 'Os melhores.',
  visibility: 'PUBLIC',
  owner: { username: 'ana', displayName: 'Ana' },
  items: [
    { position: 1, game: game(1, 'celeste', 'Celeste'), note: 'Lindo.' },
    { position: 2, game: game(2, 'hollow-knight', 'Hollow Knight'), note: null },
  ],
  createdAt: '2026-10-01T10:00:00Z',
  updatedAt: '2026-10-02T10:00:00Z',
}

const summary: ListSummary = {
  id: 7,
  title: 'Top metroidvanias',
  visibility: 'PUBLIC',
  itemCount: 2,
  preview: list.items.map((item) => item.game),
  updatedAt: list.updatedAt,
}

let calls: { method: string; url: string; body?: unknown }[]

/** Responde pelo "MÉTODO caminho" sem a query; o resto recebe 204. */
function stubApi(routes: Record<string, () => Response>) {
  calls = []
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof globalThis.fetch>(async (input, init) => {
      const method = init?.method ?? 'GET'
      const url = String(input)
      calls.push({ method, url, body: init?.body && JSON.parse(String(init.body)) })
      return routes[`${method} ${url.split('?')[0]}`]?.() ?? new Response(null, { status: 204 })
    }),
  )
}

function logIn(username: string) {
  useAuthStore().user = {
    id: 1,
    username,
    email: `${username}@example.com`,
    displayName: null,
    bio: null,
    gender: null,
  }
}

async function mountAt(path: string) {
  const blank = { render: () => null }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/games/:slug', name: 'game', component: blank },
      { path: '/u/:username', name: 'profile', component: blank },
      { path: '/u/:username/lists', name: 'profile-lists', component: ProfileListsTab },
      {
        path: '/u/:username/lists/:listId',
        name: 'list',
        component: ListView,
        props: (route) => ({
          username: route.params.username,
          listId: Number(route.params.listId),
        }),
      },
    ],
  })
  await router.push(path)
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const App = { template: '<RouterView />' }
  const wrapper = mount(App, { global: { plugins: [router, [VueQueryPlugin, { queryClient }]] } })
  return { wrapper, router }
}

const texts = (wrapper: Awaited<ReturnType<typeof mountAt>>['wrapper'], selector: string) =>
  wrapper.findAll(selector).map((item) => item.text().replace(/\s+/g, ' '))

describe('Listas', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('quem visita vê os jogos em ordem, com as notas', async () => {
    stubApi({ 'GET /api/v1/users/ana/lists/7': () => json(list) })
    const { wrapper } = await mountAt('/u/ana/lists/7')

    await vi.waitFor(() => expect(wrapper.find('h2').text()).toBe('Top metroidvanias'))
    const items = texts(wrapper, '.items > li')
    expect(items[0]).toMatch(/^1.*Celeste.*Lindo\.$/)
    expect(items[1]).toMatch(/^2.*Hollow Knight/)
    expect(wrapper.find('.by').text()).toContain('por Ana · 2 jogos')
    expect(wrapper.find('.header button').exists()).toBe(false)
  })

  it('a dona reordena e salva os itens de uma vez', async () => {
    logIn('ana')
    const reordered = { ...list, items: [...list.items].reverse() }
    stubApi({
      'GET /api/v1/me/lists/7': () => json(list),
      'PATCH /api/v1/me/lists/7': () => json(list),
      'PUT /api/v1/me/lists/7/items': () => json(reordered),
    })
    const { wrapper } = await mountAt('/u/ana/lists/7')
    await vi.waitFor(() => expect(wrapper.find('.header button').exists()).toBe(true))

    await wrapper.find('.header button').trigger('click')
    await wrapper.find('[aria-label="Subir Hollow Knight"]').trigger('click')
    await wrapper.find('form.editor').trigger('submit')
    await flushPromises()

    expect(calls).toContainEqual({
      method: 'PATCH',
      url: '/api/v1/me/lists/7',
      body: { title: 'Top metroidvanias', description: 'Os melhores.', visibility: 'PUBLIC' },
    })
    expect(calls).toContainEqual({
      method: 'PUT',
      url: '/api/v1/me/lists/7/items',
      body: {
        items: [
          { gameId: 2, note: null },
          { gameId: 1, note: 'Lindo.' },
        ],
      },
    })
    await vi.waitFor(() => expect(texts(wrapper, '.items > li')[0]).toContain('Hollow Knight'))
  })

  it('excluir pede confirmação e volta para as listas', async () => {
    logIn('ana')
    stubApi({
      'GET /api/v1/me/lists/7': () => json(list),
      'GET /api/v1/me/lists': () =>
        json({ content: [], page: { size: 24, number: 0, totalElements: 0, totalPages: 0 } }),
    })
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    const { wrapper, router } = await mountAt('/u/ana/lists/7?editar=1')
    await vi.waitFor(() => expect(wrapper.find('button.delete').exists()).toBe(true))

    await wrapper.find('button.delete').trigger('click')
    expect(calls.some((call) => call.method === 'DELETE')).toBe(false)

    await wrapper.find('button.delete').trigger('click')
    await flushPromises()

    expect(calls).toContainEqual({ method: 'DELETE', url: '/api/v1/me/lists/7', body: undefined })
    expect(router.currentRoute.value.name).toBe('profile-lists')
  })

  it('uma lista que não existe ou é privada mostra 404', async () => {
    stubApi({
      'GET /api/v1/users/ana/lists/8': () => json({ status: 404, title: 'Não encontrado' }, 404),
    })
    const { wrapper } = await mountAt('/u/ana/lists/8')

    await vi.waitFor(() => expect(wrapper.text()).toContain('Lista não encontrada.'))
  })

  it('a aba mostra as listas, e a dona cria uma nova já no editor', async () => {
    logIn('ana')
    stubApi({
      'GET /api/v1/me/lists': () =>
        json({
          content: [summary],
          page: { size: 24, number: 0, totalElements: 1, totalPages: 1 },
        }),
      'POST /api/v1/me/lists': () => json({ ...list, id: 9, title: 'Para jogar em dupla' }, 201),
      'GET /api/v1/me/lists/9': () => json({ ...list, id: 9, items: [] }),
    })
    const { wrapper, router } = await mountAt('/u/ana/lists')

    await vi.waitFor(() => expect(wrapper.find('.list-card').exists()).toBe(true))
    expect(wrapper.find('.list-card .title').text()).toBe('Top metroidvanias')
    expect(wrapper.find('.list-card .hint').text()).toBe('2 jogos')

    await wrapper.find('.new input').setValue('Para jogar em dupla')
    await wrapper.find('form.new').trigger('submit')
    await flushPromises()

    expect(calls).toContainEqual({
      method: 'POST',
      url: '/api/v1/me/lists',
      body: { title: 'Para jogar em dupla', description: null, visibility: 'PUBLIC' },
    })
    expect(router.currentRoute.value.fullPath).toBe('/u/ana/lists/9?editar=1')
  })
})
