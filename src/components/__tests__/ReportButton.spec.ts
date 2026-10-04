import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/stores/auth'
import type { PublicReview } from '@/types/api'
import ReportButton from '../ReportButton.vue'

const review: PublicReview = {
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
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

let sent: { url: string; body: unknown }[]

function stubApi(response: () => Response) {
  sent = []
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof globalThis.fetch>(async (input, init) => {
      sent.push({ url: String(input), body: JSON.parse(String(init?.body)) })
      return response()
    }),
  )
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

describe('ReportButton', () => {
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
      this.setAttribute('open', '')
    }
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
      this.removeAttribute('open')
    }
  })

  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => vi.unstubAllGlobals())

  it('não aparece sem sessão nem na própria avaliação', () => {
    expect(mount(ReportButton, { props: { review } }).find('button').exists()).toBe(false)

    logIn('ana')
    expect(mount(ReportButton, { props: { review } }).find('button').exists()).toBe(false)
  })

  it('envia o motivo e os detalhes e fica como denunciada', async () => {
    stubApi(() => new Response(null, { status: 201 }))
    logIn('bia')
    const wrapper = mount(ReportButton, { props: { review } })

    await wrapper.find('button.report').trigger('click')
    await wrapper.find('input[value="OTHER"]').setValue(true)
    await wrapper.find('textarea').setValue('Propaganda.')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(sent).toEqual([
      { url: '/api/v1/reviews/9/reports', body: { reason: 'OTHER', details: 'Propaganda.' } },
    ])
    expect(wrapper.find('[role="status"]').text()).toBe('Denúncia enviada. A moderação vai olhar.')
    expect(wrapper.find('button.report').text()).toBe('Denunciada')
    expect(wrapper.find('button.report').attributes()).toHaveProperty('disabled')
  })

  it('mostra quando a denúncia já está aberta', async () => {
    const detail = 'Você já denunciou esta avaliação, e a denúncia ainda está aberta.'
    stubApi(() => json({ status: 409, title: 'Conflito', detail }, 409))
    logIn('bia')
    const wrapper = mount(ReportButton, { props: { review } })

    await wrapper.find('button.report').trigger('click')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toBe(detail)
    expect(wrapper.find('button.report').text()).toBe('Denunciar')
  })
})
