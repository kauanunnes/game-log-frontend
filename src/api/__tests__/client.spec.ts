import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, errorMessage, setAccessToken } from '../client'

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const mockFetch = (...responses: Response[]) => {
  const fetch = vi.fn<typeof globalThis.fetch>()
  responses.forEach((res) => fetch.mockResolvedValueOnce(res))
  vi.stubGlobal('fetch', fetch)
  return fetch
}

const authorization = (call?: Parameters<typeof globalThis.fetch>) =>
  new Headers(call?.[1]?.headers).get('Authorization')

describe('api', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    setAccessToken(null)
  })

  it('envia o token e devolve o JSON', async () => {
    const fetch = mockFetch(json(200, { ok: true }))
    setAccessToken('abc')

    await expect(api('/me')).resolves.toEqual({ ok: true })
    expect(fetch.mock.calls[0]?.[0]).toBe('/api/v1/me')
    expect(authorization(fetch.mock.calls[0])).toBe('Bearer abc')
  })

  it('renova a sessão uma vez quando recebe 401', async () => {
    const fetch = mockFetch(
      json(401, {}),
      json(200, { accessToken: 'novo', expiresIn: 900 }),
      json(200, { ok: true }),
    )
    setAccessToken('velho')

    await expect(api('/me')).resolves.toEqual({ ok: true })
    expect(fetch.mock.calls[1]?.[0]).toBe('/api/v1/auth/refresh')
    expect(authorization(fetch.mock.calls[2])).toBe('Bearer novo')
  })

  it('transforma a resposta de erro em ApiError', async () => {
    mockFetch(json(422, { title: 'Dados inválidos', status: 422, detail: 'Nota inválida.' }))

    await expect(api('/me/library/1', { method: 'PUT', body: {} })).rejects.toMatchObject({
      message: 'Nota inválida.',
      problem: { status: 422 },
    })
  })
})

describe('errorMessage', () => {
  afterEach(() => vi.unstubAllGlobals())

  const failure = async (status: number, body: unknown) => {
    mockFetch(json(status, body))
    return api('/me').catch(errorMessage)
  }

  it('junta os motivos dos campos inválidos', async () => {
    const message = await failure(422, {
      status: 422,
      title: 'Dados inválidos',
      errors: [
        { field: 'rating', message: 'nota inválida' },
        { field: 'text', message: 'texto longo demais' },
      ],
    })

    expect(message).toBe('nota inválida · texto longo demais')
  })

  it('num erro do servidor, mostra o código para achar o caso nos logs', async () => {
    const message = await failure(500, {
      status: 500,
      title: 'Erro inesperado',
      detail: 'Algo deu errado. Tente de novo em instantes.',
      traceId: '4bf92f3577b34da6',
    })

    expect(message).toBe(
      'Algo deu errado. Tente de novo em instantes. Código do erro: 4bf92f3577b34da6.',
    )
  })

  it('sem resposta do servidor, avisa que não conectou', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof globalThis.fetch>().mockRejectedValue(new TypeError('Failed to fetch')),
    )

    expect(await api('/me').catch(errorMessage)).toBe('Não foi possível conectar ao servidor.')
  })
})
