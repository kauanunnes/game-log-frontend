import { flushPromises, mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { Me } from '@/types/api'
import ForgotPasswordView from '../ForgotPasswordView.vue'
import ResetPasswordView from '../ResetPasswordView.vue'
import VerifyEmailView from '../VerifyEmailView.vue'
import SettingsAccountTab from '../settings/SettingsAccountTab.vue'

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

let calls: { method: string; url: string; body?: unknown }[]

function stubApi(respond: () => Response = () => new Response(null, { status: 204 })) {
  calls = []
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof globalThis.fetch>(async (input, init) => {
      calls.push({
        method: init?.method ?? 'GET',
        url: String(input),
        body: init?.body && JSON.parse(String(init.body)),
      })
      return respond()
    }),
  )
}

const invalidLink = () =>
  json(
    {
      status: 422,
      title: 'Dados inválidos',
      code: 'INVALID_TOKEN',
      errors: [{ field: 'token', message: 'link inválido ou expirado' }],
    },
    422,
  )

async function mountAt(path: string) {
  const blank = { render: () => null }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: blank },
      { path: '/login', name: 'login', component: blank },
      { path: '/forgot-password', name: 'forgot-password', component: ForgotPasswordView },
      { path: '/reset-password', name: 'reset-password', component: ResetPasswordView },
      { path: '/verify-email', name: 'verify-email', component: VerifyEmailView },
    ],
  })
  await router.push(path)
  const queryClient = new QueryClient()
  const App = { template: '<RouterView />' }
  const wrapper = mount(App, { global: { plugins: [router, [VueQueryPlugin, { queryClient }]] } })
  return { wrapper, router }
}

describe('Recuperar a conta', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => vi.unstubAllGlobals())

  it('pede o link sem revelar se o e-mail tem conta', async () => {
    stubApi()
    const { wrapper } = await mountAt('/forgot-password')

    await wrapper.find('input[type="email"]').setValue('ana@example.com')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(calls).toEqual([
      { method: 'POST', url: '/api/v1/auth/password/forgot', body: { email: 'ana@example.com' } },
    ])
    expect(wrapper.find('[role="status"]').text()).toContain('Se esse e-mail tiver conta')
  })

  it('redefine a senha com o token do link e volta para o login', async () => {
    stubApi()
    const { wrapper, router } = await mountAt('/reset-password?token=abc')
    const [next, confirmation] = wrapper.findAll('input[type="password"]')

    await next?.setValue('senha-nova-1')
    await confirmation?.setValue('senha-nova-2')
    await wrapper.find('form').trigger('submit')
    expect(calls).toEqual([])
    expect(wrapper.find('[role="alert"]').text()).toBe('A confirmação não é igual à nova senha.')

    await confirmation?.setValue('senha-nova-1')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(calls).toEqual([
      {
        method: 'POST',
        url: '/api/v1/auth/password/reset',
        body: { token: 'abc', newPassword: 'senha-nova-1' },
      },
    ])
    expect(router.currentRoute.value.name).toBe('login')
  })

  it('um link vencido pede outro', async () => {
    stubApi(invalidLink)
    const { wrapper } = await mountAt('/reset-password?token=velho')
    for (const input of wrapper.findAll('input[type="password"]'))
      await input.setValue('senha-nova-1')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toContain('link inválido ou expirado')
    expect(wrapper.find('[role="alert"] a').attributes('href')).toBe('/forgot-password')
  })

  it('confirma o e-mail ao abrir o link', async () => {
    stubApi()
    const { wrapper } = await mountAt('/verify-email?token=abc')

    await vi.waitFor(() => expect(wrapper.text()).toContain('E-mail confirmado.'))
    expect(calls[0]).toEqual({
      method: 'POST',
      url: '/api/v1/auth/email/verify',
      body: { token: 'abc' },
    })
  })

  it('explica quando o link de confirmação não vale mais', async () => {
    stubApi(invalidLink)
    const { wrapper } = await mountAt('/verify-email?token=velho')

    await vi.waitFor(() => expect(wrapper.text()).toContain('Este link não vale mais'))
  })
})

describe('Aba Conta', () => {
  const me: Me = {
    id: 1,
    username: 'ana',
    email: 'ana@example.com',
    emailVerified: false,
    displayName: null,
    bio: null,
    gender: null,
  }

  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => vi.unstubAllGlobals())

  it('reenvia a confirmação de um e-mail não confirmado', async () => {
    stubApi()
    const wrapper = mount(SettingsAccountTab, { props: { me } })

    expect(wrapper.find('mark').text()).toBe('Não confirmado')
    await wrapper.find('button[type="button"]').trigger('click')
    await flushPromises()

    expect(calls).toEqual([
      { method: 'POST', url: '/api/v1/me/email/verification', body: undefined },
    ])
    expect(wrapper.find('[role="status"]').text()).toContain('Enviamos um novo link')
  })

  it('não oferece reenviar quando o e-mail já foi confirmado', () => {
    const wrapper = mount(SettingsAccountTab, { props: { me: { ...me, emailVerified: true } } })

    expect(wrapper.find('mark').text()).toBe('Confirmado')
    expect(wrapper.find('button[type="button"]').exists()).toBe(false)
  })
})
