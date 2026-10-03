import { flushPromises, mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/stores/auth'
import type { LibraryEntry } from '@/types/api'
import LibraryEntryDialog from '../LibraryEntryDialog.vue'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const game = { id: 7, slug: 'hades', title: 'Hades' }

const played: LibraryEntry = {
  game: { id: 7, slug: 'hades', title: 'Hades', coverUrl: null, releaseYear: 2020 },
  status: 'PLAYED',
  favorite: false,
  review: { rating: 4.5, recommends: true, text: null, hasSpoilers: false },
  playthrough: null,
  acquisition: null,
  createdAt: '2026-10-01T10:00:00Z',
  updatedAt: '2026-10-01T10:00:00Z',
}

let fetch: ReturnType<typeof vi.fn<typeof globalThis.fetch>>

function mountDialog(entry: LibraryEntry | null, saveResponse: Response = json(played)) {
  fetch = vi.fn<typeof globalThis.fetch>(async (input) => {
    const path = String(input)
    if (path === '/api/v1/platforms') return json([{ id: 8, name: 'Switch', slug: 'switch' }])
    if (path === '/api/v1/stores') return json([{ id: 1, name: 'Steam', slug: 'steam' }])
    return saveResponse
  })
  vi.stubGlobal('fetch', fetch)
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return mount(LibraryEntryDialog, {
    props: { open: false, game, entry },
    global: { plugins: [[VueQueryPlugin, { queryClient }]] },
  })
}

const legends = (wrapper: ReturnType<typeof mountDialog>) =>
  wrapper.findAll('legend').map((legend) => legend.text())

function sentBody() {
  const call = fetch.mock.calls.find(([, init]) => init?.method === 'PUT')
  return JSON.parse(String(call?.[1]?.body))
}

describe('LibraryEntryDialog', () => {
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
      this.setAttribute('open', '')
    }
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
      this.removeAttribute('open')
    }
  })

  beforeEach(() => {
    setActivePinia(createPinia())
    useAuthStore().user = {
      id: 1,
      username: 'ana',
      email: 'ana@example.com',
      displayName: null,
      bio: null,
      gender: null,
      defaultCurrency: 'BRL',
    }
  })

  afterEach(() => vi.unstubAllGlobals())

  it('mostra só as seções que o status aceita', async () => {
    const wrapper = mountDialog(null)
    await wrapper.setProps({ open: true })

    expect(legends(wrapper)).toEqual(['Status', 'Aquisição'])

    await wrapper.find('input[type=radio][value=PLAYED]').setValue()
    expect(legends(wrapper)).toEqual(['Status', 'Avaliação', 'Jogatina', 'Aquisição'])
    expect(wrapper.text()).toContain('Zerei')
    expect(wrapper.text()).toContain('Favorito')
  })

  it('envia só o que vale no status, com o valor pago no formato da API', async () => {
    const wrapper = mountDialog(null)
    await wrapper.setProps({ open: true })
    await wrapper.find('input[type=radio][value=PLAYED]').setValue()
    await wrapper.find('input[name=recommends][value=true]').setValue()
    await wrapper.find('textarea').setValue('  Muito bom.  ')
    await wrapper.find('input[type=number]').setValue('12')
    const completed = wrapper.findAll('label').find((label) => label.text() === 'Zerei')
    await completed?.find('input').setValue(true)
    const method = wrapper.findAll('select').find((select) => select.text().includes('Compra'))
    await method?.setValue('PURCHASED')
    await wrapper.find('input[inputmode=decimal]').setValue('46,99')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(sentBody()).toEqual({
      status: 'PLAYED',
      favorite: false,
      review: { rating: null, recommends: true, text: 'Muito bom.', hasSpoilers: false },
      playthrough: {
        platformId: null,
        hoursPlayed: 12,
        startedOn: null,
        finishedOn: null,
        completed: true,
      },
      acquisition: {
        method: 'PURCHASED',
        storeId: null,
        price: { amount: '46.99', currency: 'BRL' },
        acquiredOn: null,
      },
    })
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('avisa o que sai ao trocar para um status que não aceita', async () => {
    const wrapper = mountDialog(played)
    await wrapper.setProps({ open: true })

    await wrapper.find('input[type=radio][value=WISHLIST]').setValue()

    expect(wrapper.find('.warning').text()).toBe('Ao salvar como Lista de desejos, sai: avaliação.')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(sentBody().review).toBeNull()
  })

  it('mostra o motivo quando a API recusa', async () => {
    const problem = {
      title: 'Dados inválidos',
      status: 422,
      errors: [{ field: 'acquisition.storeId', message: 'loja não encontrada' }],
    }
    const wrapper = mountDialog(null, json(problem, 422))
    await wrapper.setProps({ open: true })

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[role=alert]').text()).toBe('loja não encontrada')
    expect(wrapper.emitted('close')).toBeUndefined()
  })
})
