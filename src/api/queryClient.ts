import { QueryClient } from '@tanstack/vue-query'
import { ApiError } from './client'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      // Um 4xx falharia igual de novo; só vale repetir erro de rede ou do servidor.
      retry: (failures, error) =>
        failures < 2 && !(error instanceof ApiError && error.problem.status < 500),
    },
  },
})
