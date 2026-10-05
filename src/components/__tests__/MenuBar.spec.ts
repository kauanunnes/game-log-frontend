import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { Me } from '@/types/api'
import MenuBar from '../MenuBar.vue'

const empty = { render: () => null }

let wrapper: VueWrapper | undefined

async function mountAt(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: empty },
      { path: '/games', name: 'explore', component: empty },
      { path: '/login', name: 'login', component: empty },
      { path: '/signup', name: 'signup', component: empty },
      { path: '/forgot-password', name: 'forgot-password', component: empty },
      { path: '/u/:username', name: 'profile', component: empty },
      { path: '/for-you', name: 'for-you', component: empty },
      { path: '/feed', name: 'feed', component: empty },
      { path: '/settings', name: 'settings', component: empty },
      { path: '/admin/reports', name: 'moderation', component: empty },
    ],
  })
  await router.push(path)
  wrapper = mount(MenuBar, { global: { plugins: [router] }, attachTo: document.body })
  return { wrapper, router }
}

const menu = (label: string) =>
  wrapper!.findAll('.menus > li').find((li) => li.find('button').text() === label)!

const items = (label: string) =>
  menu(label)
    .findAll('.dropdown li')
    .map((item) => item.text())

const opened = (label: string) => menu(label).find('.dropdown').isVisible()

function signIn(user: Partial<Me>) {
  useAuthStore().user = {
    id: 1,
    username: 'ana',
    email: 'ana@example.com',
    displayName: null,
    bio: null,
    gender: null,
    ...user,
  }
}

describe('MenuBar', () => {
  beforeEach(() => setActivePinia(createPinia()))

  afterEach(() => {
    wrapper?.unmount()
    vi.unstubAllGlobals()
    localStorage.clear()
    delete document.documentElement.dataset.theme
  })

  it('sem sessão, o menu Usuário oferece entrar e criar conta, voltando para a página atual', async () => {
    await mountAt('/games?q=zelda')
    expect(opened('Usuário')).toBe(false)

    await menu('Usuário').find('button').trigger('click')

    expect(opened('Usuário')).toBe(true)
    expect(items('Usuário')).toEqual(['Entrar', 'Criar conta', 'Esqueci minha senha'])
    const href = menu('Usuário').find('a').attributes('href') ?? ''
    expect(new URL(href, 'http://localhost').searchParams.get('redirect')).toBe('/games?q=zelda')
  })

  it('com sessão, o menu leva o nome da pessoa e os atalhos da conta', async () => {
    signIn({ username: 'ana', role: 'ADMIN' })
    await mountAt('/')

    await menu('ana').find('button').trigger('click')

    expect(items('ana')).toEqual([
      'Meu perfil',
      'Para você',
      'Feed',
      'Configurações',
      'Moderação',
      'Sair',
    ])
    expect(menu('ana').find('a').attributes('href')).toBe('/u/ana')
  })

  it('com um menu aberto, passar o mouse em outro troca de menu; Esc fecha', async () => {
    await mountAt('/')

    await menu('Ajuda').trigger('mouseenter')
    expect(opened('Ajuda')).toBe(false)

    await menu('Jogos').find('button').trigger('click')
    await menu('Ajuda').trigger('mouseenter')
    expect(opened('Jogos')).toBe(false)
    expect(opened('Ajuda')).toBe(true)

    await menu('Ajuda').find('button').trigger('keydown', { key: 'Escape' })
    expect(opened('Ajuda')).toBe(false)
  })

  it('fecha ao clicar fora e ao mudar de página', async () => {
    const { router } = await mountAt('/')

    await menu('Jogos').find('button').trigger('click')
    document.body.click()
    await flushPromises()
    expect(opened('Jogos')).toBe(false)

    await menu('Jogos').find('button').trigger('click')
    await router.push('/games')
    await flushPromises()
    expect(opened('Jogos')).toBe(false)
  })

  it('o menu Exibir troca o tema, marca a opção escolhida e fecha', async () => {
    await mountAt('/')
    const option = (label: string) =>
      menu('Exibir')
        .findAll('.dropdown button')
        .find((button) => button.text() === label)!

    await menu('Exibir').find('button').trigger('click')
    expect(items('Exibir')).toEqual(['Tema claro', 'Tema escuro', 'Tema do sistema'])
    expect(option('Tema do sistema').attributes('aria-pressed')).toBe('true')

    await option('Tema escuro').trigger('click')

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(opened('Exibir')).toBe(false)
    expect(option('Tema escuro').attributes('aria-pressed')).toBe('true')
    expect(option('Tema do sistema').attributes('aria-pressed')).toBe('false')
  })

  it('Sair encerra a sessão e volta para o início', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof globalThis.fetch>(async () => new Response(null, { status: 204 })),
    )
    signIn({ username: 'bia' })
    const { router } = await mountAt('/games')

    await menu('bia').find('button').trigger('click')
    const buttons = menu('bia').findAll('.dropdown button')
    await buttons[buttons.length - 1]?.trigger('click')
    await flushPromises()

    expect(useAuthStore().isLoggedIn).toBe(false)
    expect(router.currentRoute.value.name).toBe('home')
  })
})
