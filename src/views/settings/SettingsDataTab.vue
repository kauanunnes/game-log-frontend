<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQueryClient } from '@tanstack/vue-query'
import { deleteMe, exportMyData } from '@/api/me'
import { useSubmit } from '@/lib/useSubmit'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const queryClient = useQueryClient()

/** O link do arquivo vale até sair da aba: o navegador ainda lê o arquivo depois do clique. */
let fileUrl = ''
onBeforeUnmount(() => fileUrl && URL.revokeObjectURL(fileUrl))

const {
  busy: exporting,
  error: exportError,
  done: exported,
  submit: download,
} = useSubmit(async () => {
  const data = await exportMyData()
  if (fileUrl) URL.revokeObjectURL(fileUrl)
  fileUrl = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
  )
  const link = document.createElement('a')
  link.href = fileUrl
  link.download = `game-log-${data.account.username}-${data.exportedAt.slice(0, 10)}.json`
  link.click()
})

const password = ref('')

const { busy, error, submit } = useSubmit(async () => {
  await deleteMe(password.value)
  await auth.logout()
  // As avaliações e os números da conta somem junto; nada disso pode sobrar no cache.
  queryClient.removeQueries()
  await router.push({ name: 'home', state: { notice: 'Sua conta foi excluída.' } })
})

function confirmDelete() {
  if (window.confirm('Excluir sua conta e todos os seus dados? Não dá para desfazer.')) {
    return submit()
  }
}
</script>

<template>
  <div class="data">
    <fieldset>
      <legend>Exportar dados</legend>
      <p class="prose">
        Um arquivo JSON com sua conta, biblioteca, avaliações, gastos, listas, quem você segue e as
        avaliações que curtiu.
      </p>
      <p v-if="exportError" class="error" role="alert">{{ exportError }}</p>
      <p v-else-if="exported" class="prose success" role="status">
        Arquivo gerado. Confira seus downloads.
      </p>
      <div class="actions">
        <button type="button" :disabled="exporting" @click="download">Exportar</button>
      </div>
    </fieldset>

    <fieldset>
      <legend>Excluir conta</legend>
      <p class="prose">
        Apaga para sempre seu perfil, sua biblioteca e suas avaliações. Não dá para desfazer.
      </p>
      <form class="form" @submit.prevent="confirmDelete">
        <label>
          Senha
          <input v-model="password" type="password" autocomplete="current-password" required />
        </label>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <div class="actions">
          <button type="submit" :disabled="busy">Excluir minha conta</button>
        </div>
      </form>
    </fieldset>
  </div>
</template>

<style scoped>
.data {
  display: grid;
  gap: 12px;
}

p {
  margin: 0;
}
</style>
