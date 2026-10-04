import { mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { ReportedReview } from '@/types/api'
import ModerationView from '../ModerationView.vue'

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } })

const reported: ReportedReview = {
  review: {
    id: 9,
    user: { username: 'ana', displayName: 'Ana' },
    game: { id: 2, slug: 'celeste', title: 'Celeste', coverUrl: null, releaseYear: 2018 },
    status: 'PLAYED',
    rating: 4,
    recommends: true,
    text: 'Compre no meu site!',
    hasSpoilers: false,
    reviewedAt: '2026-10-02T12:00:00Z',
    likes: 0,
  },
  reports: [
    { id: 31, reason: 'SPAM', details: null, reporter: 'bia', createdAt: '2026-10-03T10:00:00Z' },
    {
      id: 32,
      reason: 'OTHER',
      details: 'Propaganda disfarçada.',
      reporter: 'caio',
      createdAt: '2026-10-03T11:00:00Z',
    },
  ],
}

let calls: { method: string; url: string; body?: unknown }[]

function stubApi() {
  calls = []
  let open = true
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof globalThis.fetch>(async (input, init) => {
      const method = init?.method ?? 'GET'
      calls.push({ method, url: String(input), body: init?.body && JSON.parse(String(init.body)) })
      if (method === 'PATCH') {
        open = false
        return new Response(null, { status: 204 })
      }
      const content = open ? [reported] : []
      return json({
        content,
        page: { size: 10, number: 0, totalElements: content.length, totalPages: 1 },
      })
    }),
  )
}

async function mountView() {
  const blank = { render: () => null }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/admin/reports', name: 'moderation', component: ModerationView },
      { path: '/games/:slug', name: 'game', component: blank },
      { path: '/u/:username', name: 'profile', component: blank },
    ],
  })
  await router.push('/admin/reports')
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const App = { template: '<RouterView />' }
  return mount(App, { global: { plugins: [router, [VueQueryPlugin, { queryClient }]] } })
}

describe('ModerationView', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('mostra cada avaliação com as denúncias dela', async () => {
    stubApi()
    const wrapper = await mountView()

    await vi.waitFor(() => expect(wrapper.find('.reports').exists()).toBe(true))
    const reports = wrapper.findAll('.reports li').map((item) => item.text().replace(/\s+/g, ' '))
    expect(reports[0]).toContain('Spam ou propaganda · @bia')
    expect(reports[1]).toContain('Outro motivo · @caio')
    expect(reports[1]).toContain('Propaganda disfarçada.')
    expect(wrapper.find('.review').text()).toContain('Compre no meu site!')
    expect(wrapper.find('.review .like').exists()).toBe(false)
  })

  it('manter resolve todas as denúncias da avaliação', async () => {
    stubApi()
    const wrapper = await mountView()
    await vi.waitFor(() => expect(wrapper.find('.actions button').exists()).toBe(true))

    await wrapper.find('.actions button').trigger('click')

    await vi.waitFor(() => expect(wrapper.text()).toContain('Nenhuma denúncia aberta.'))
    expect(calls).toContainEqual({
      method: 'PATCH',
      url: '/api/v1/admin/reports/31',
      body: { decision: 'KEEP' },
    })
  })

  it('remover pede confirmação antes', async () => {
    stubApi()
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const wrapper = await mountView()
    await vi.waitFor(() => expect(wrapper.findAll('.actions button')).toHaveLength(2))

    await wrapper.findAll('.actions button')[1]?.trigger('click')

    expect(window.confirm).toHaveBeenCalled()
    expect(calls.some((call) => call.method === 'PATCH')).toBe(false)
  })
})
