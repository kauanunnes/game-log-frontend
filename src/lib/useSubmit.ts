import { ref } from 'vue'
import { errorMessage } from '@/api/client'

/** Envio de formulário: ocupado enquanto roda, a mensagem de erro e se terminou bem. */
export function useSubmit(action: () => Promise<unknown>) {
  const busy = ref(false)
  const error = ref<string | null>(null)
  const done = ref(false)

  async function submit() {
    busy.value = true
    error.value = null
    done.value = false
    try {
      await action()
      done.value = true
    } catch (e) {
      error.value = errorMessage(e)
    } finally {
      busy.value = false
    }
  }

  return { busy, error, done, submit }
}
