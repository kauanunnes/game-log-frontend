import { mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { PublicReview } from '@/types/api'
import LikeButton from '../LikeButton.vue'

const review: PublicReview = {
  id: 7,
  user: { username: 'ana', displayName: 'Ana' },
  game: { id: 2, slug: 'celeste', title: 'Celeste', coverUrl: null, releaseYear: 2018 },
  status: 'PLAYED',
  rating: 4.5,
  recommends: true,
  text: 'Difícil e justo.',
  hasSpoilers: false,
  reviewedAt: '2026-10-02T12:00:00Z',
  likes: 1,
}

let calls: string[]

function mountButton(liked = false) {
  calls = []
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof globalThis.fetch>(async (input, init) => {
      calls.push(`${init?.method ?? 'GET'} ${String(input)}`)
      return new Response(null, { status: 204 })
    }),
  )
  const blank = { render: () => null }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: blank },
      { path: '/login', name: 'login', component: blank },
    ],
  })
  const queryClient = new QueryClient()
  return mount(LikeButton, {
    props: { review, liked },
    global: { plugins: [router, [VueQueryPlugin, { queryClient }]] },
  })
}

function logIn(username: string) {
  useAuthStore().user = {
    id: 2,
    username,
    email: `${username}@example.com`,
    displayName: null,
    bio: null,
    gender: null,
  }
}

describe('LikeButton', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => vi.unstubAllGlobals())

  it('sem sessão, leva ao login', () => {
    const wrapper = mountButton()

    expect(wrapper.find('a').attributes('href')).toMatch(/^\/login\?redirect=/)
    expect(wrapper.text()).toContain('1 curtida')
  })

  it('na própria avaliação, só mostra a contagem', () => {
    logIn('ana')
    const wrapper = mountButton()

    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.text()).toContain('1 curtida')
  })

  it('curte e descurte, mudando a contagem na hora', async () => {
    logIn('bia')
    const wrapper = mountButton()
    const button = () => wrapper.find('button')

    await button().trigger('click')
    await vi.waitFor(() => expect(button().attributes('aria-pressed')).toBe('true'))
    expect(button().text()).toContain('2 curtidas')

    await button().trigger('click')
    await vi.waitFor(() => expect(button().attributes('aria-pressed')).toBe('false'))
    expect(button().text()).toContain('1 curtida')
    expect(calls).toEqual(['PUT /api/v1/reviews/7/like', 'DELETE /api/v1/reviews/7/like'])
  })
})
