import { mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { GameDetails, PublicReview } from '@/types/api'
import GameView from '../GameView.vue'

const distribution = Array.from({ length: 11 }, (_, i) => ({ stars: i / 2, count: 0 }))

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
  community: {
    averageRating: 4.38,
    ratingsCount: 2,
    ratingDistribution: distribution.map((bucket) =>
      bucket.stars === 4 || bucket.stars === 4.5 ? { ...bucket, count: 1 } : bucket,
    ),
    recommendPercent: 50,
    playersCount: 3,
    wantToPlayCount: 7,
  },
}

let nextId = 1
const review = (username: string, text: string, hasSpoilers = false): PublicReview => ({
  id: nextId++,
  user: { username, displayName: null },
  game: { id: 2, slug: 'hollow-knight', title: 'Hollow Knight', coverUrl: null, releaseYear: 2017 },
  status: 'PLAYED',
  rating: 4.5,
  recommends: true,
  text,
  hasSpoilers,
  reviewedAt: '2026-09-01T12:00:00Z',
  likes: 0,
})

const page = <T>(...content: T[]) => ({
  content,
  page: { size: 10, number: 0, totalElements: content.length, totalPages: 1 },
})

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

function mountGame(game: Response, reviews: Response = json(page())) {
  return mountWith(async (input) => (String(input).includes('/reviews') ? reviews : game))
}

function mountWith(fetch: typeof globalThis.fetch) {
  vi.stubGlobal('fetch', vi.fn<typeof globalThis.fetch>(fetch))
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/games', name: 'explore', component: { render: () => null } },
      { path: '/games/:slug', name: 'game', component: GameView, props: true },
      { path: '/u/:username', name: 'profile', component: { render: () => null } },
      { path: '/login', name: 'login', component: { render: () => null } },
    ],
  })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return mount(GameView, {
    props: { slug: 'hollow-knight' },
    global: { plugins: [router, createPinia(), [VueQueryPlugin, { queryClient }]] },
  })
}

describe('GameView', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('ordena as avaliações pelas mais curtidas pela URL', async () => {
    const urls: string[] = []
    const wrapper = mountWith(async (input) => {
      urls.push(String(input))
      return String(input).includes('/reviews')
        ? json(page(review('ana', 'Lindo.'), review('bia', 'Bom.')))
        : json(hollowKnight)
    })

    await wrapper.vm.$router.push('/games/hollow-knight')
    await vi.waitFor(() => expect(wrapper.find('.sort select').exists()).toBe(true))
    expect(urls).toContain('/api/v1/games/hollow-knight/reviews?page=0&size=10&sort=recent')

    await wrapper.find('.sort select').setValue('likes')
    await vi.waitFor(() =>
      expect(urls).toContain('/api/v1/games/hollow-knight/reviews?page=0&size=10&sort=likes'),
    )
  })

  it('mostra os dados do jogo e liga os gêneros à busca', async () => {
    const wrapper = mountGame(json(hollowKnight))

    await vi.waitFor(() => expect(wrapper.find('h2').text()).toBe('Hollow Knight'))
    expect(wrapper.text()).toContain('24 de fevereiro de 2017')
    expect(wrapper.text()).toContain('por Team Cherry')
    expect(wrapper.find('.display').text()).toBe('90')
    expect(wrapper.find('[aria-label=Gêneros] a').attributes('href')).toBe('/games?genre=2')
    expect(wrapper.find('dl').text()).toContain('Fantasy')
    // sem login, a seção da biblioteca convida a entrar e voltar para cá
    expect(wrapper.find('.library a').attributes('href')).toBe('/login?redirect=/')
  })

  it('mostra os números da comunidade', async () => {
    const wrapper = mountGame(json(hollowKnight))

    await vi.waitFor(() => expect(wrapper.find('.community').exists()).toBe(true))
    const community = wrapper.find('.community')
    expect(community.find('[role=img]').attributes('aria-label')).toBe(
      'Média da comunidade: 4,38 de 5',
    )
    expect(community.text()).toContain('2 notas')
    expect(community.text()).toContain('50%')
    expect(community.findAll('.bar')).toHaveLength(11)
  })

  it('lista as avaliações e esconde o spoiler até o clique', async () => {
    const wrapper = mountGame(
      json(hollowKnight),
      json(page(review('ana', 'Lindo.'), review('bia', 'O final é um sonho.', true))),
    )

    await vi.waitFor(() => expect(wrapper.findAll('.review')).toHaveLength(2))
    expect(wrapper.text()).toContain('Lindo.')
    expect(wrapper.text()).not.toContain('O final é um sonho.')

    await wrapper.find('.spoiler').trigger('click')
    expect(wrapper.text()).toContain('O final é um sonho.')
  })

  it('avisa quando o jogo não existe', async () => {
    const wrapper = mountGame(json({ title: 'Não encontrado', status: 404 }, 404))

    await vi.waitFor(() => expect(wrapper.text()).toContain('Não existe jogo no endereço'))
  })
})
