import { mount } from '@vue/test-utils'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { queryClient } from '@/api/queryClient'
import { useAuthStore } from '@/stores/auth'
import UserWindow from '../UserWindow.vue'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const stats = {
  total: 10,
  byStatus: { PLAYED: 5, PLAYING: 1, BACKLOG: 3, WISHLIST: 1, DROPPED: 0 },
  hoursPlayed: 100,
}

const playing = {
  content: [
    {
      game: { id: 7, slug: 'hades', title: 'Hades', coverUrl: null, releaseYear: 2020 },
      status: 'PLAYING',
      favorite: false,
      review: null,
      playthrough: null,
      acquisition: null,
      createdAt: '2026-10-01T10:00:00Z',
      updatedAt: '2026-10-01T10:00:00Z',
    },
  ],
  page: { size: 3, number: 0, totalElements: 1, totalPages: 1 },
}

async function mountAt(path: string) {
  const empty = { render: () => null }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: empty },
      { path: '/games', name: 'explore', component: empty },
      { path: '/games/:slug', name: 'game', component: empty },
      { path: '/login', name: 'login', component: empty },
      { path: '/signup', name: 'signup', component: empty },
      { path: '/feed', name: 'feed', component: empty },
      { path: '/for-you', name: 'for-you', component: empty },
      { path: '/settings/profile', name: 'settings', component: empty },
      { path: '/u/:username', name: 'profile', component: empty },
    ],
  })
  await router.push(path)
  const wrapper = mount(UserWindow, {
    global: { plugins: [router, [VueQueryPlugin, { queryClient }]] },
  })
  return { wrapper, router }
}

const link = (wrapper: Awaited<ReturnType<typeof mountAt>>['wrapper'], text: string) =>
  wrapper.findAll('a').find((a) => a.text() === text)

describe('UserWindow', () => {
  beforeEach(() => setActivePinia(createPinia()))

  afterEach(() => {
    vi.unstubAllGlobals()
    queryClient.clear()
  })

  it('convida para entrar e depois volta para a página atual', async () => {
    const { wrapper } = await mountAt('/games?q=zelda')

    expect(wrapper.find('h1').text()).toBe('Bem-vindo.exe')
    const href = link(wrapper, 'Entrar')?.attributes('href') ?? ''
    expect(new URL(href, 'http://localhost').searchParams.get('redirect')).toBe('/games?q=zelda')
    expect(link(wrapper, 'Criar conta')?.attributes('href')).toBe('/signup')
  })

  it('mostra a conta, os contadores e o que está jogando', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof globalThis.fetch>(async (input) =>
        String(input).startsWith('/api/v1/me/stats') ? json(stats) : json(playing),
      ),
    )
    useAuthStore().user = {
      id: 1,
      username: 'ana',
      email: 'ana@example.com',
      displayName: 'Ana',
      bio: null,
      gender: null,
    }
    const { wrapper } = await mountAt('/')

    await vi.waitFor(() => expect(wrapper.text()).toContain('Hades'))
    expect(wrapper.find('h1').text()).toBe('ana.exe')
    expect(wrapper.text()).toContain('@ana')
    expect(wrapper.find('.counts').text()).toContain('Jogado5')
    expect(link(wrapper, 'Hades')?.attributes('href')).toBe('/games/hades')
  })
})
