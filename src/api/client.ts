import type { ProblemDetail, TokenResponse } from '@/types/api'

type ApiInit = Omit<RequestInit, 'body'> & { body?: unknown }

const BASE_URL = '/api/v1'

let accessToken: string | null = null
let refreshing: Promise<boolean> | null = null

export class ApiError extends Error {
  constructor(readonly problem: ProblemDetail) {
    super(problem.detail ?? problem.title)
  }
}

/** Mensagem para mostrar ao usuário, com o motivo de cada campo inválido quando houver. */
export function errorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Não foi possível conectar ao servidor.'
  const fields = error.problem.errors?.map((issue) => issue.message) ?? []
  return fields.length ? fields.join(' · ') : error.message
}

export function setAccessToken(token: string | null) {
  accessToken = token
}

function send(path: string, { body, ...init }: ApiInit = {}) {
  const headers = new Headers(init.headers)
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  if (body !== undefined) headers.set('Content-Type', 'application/json')
  return fetch(BASE_URL + path, {
    ...init,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

export function refreshSession(): Promise<boolean> {
  refreshing ??= send('/auth/refresh', { method: 'POST' })
    .then(async (res) => {
      setAccessToken(res.ok ? ((await res.json()) as TokenResponse).accessToken : null)
      return res.ok
    })
    .catch(() => false)
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

async function toProblem(res: Response): Promise<ProblemDetail> {
  const fallback: ProblemDetail = {
    type: 'about:blank',
    title:
      res.status >= 500 ? 'Servidor indisponível. Tente de novo em instantes.' : 'Erro inesperado.',
    status: res.status,
  }
  if (!res.headers.get('Content-Type')?.includes('json')) return fallback
  return { ...fallback, ...((await res.json()) as Partial<ProblemDetail>) }
}

export async function api<T>(path: string, init?: ApiInit): Promise<T> {
  let res = await send(path, init)
  if (res.status === 401 && accessToken && (await refreshSession())) res = await send(path, init)
  if (!res.ok) throw new ApiError(await toProblem(res))
  // Sem corpo (um 204, ou um 201 que só confirma), a resposta vira undefined.
  const json = res.headers.get('Content-Type')?.includes('json')
  return (json ? await res.json() : undefined) as T
}
