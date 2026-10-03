<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQueryClient } from '@tanstack/vue-query'
import { deleteMe } from '@/api/me'
import { useSubmit } from '@/lib/useSubmit'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const queryClient = useQueryClient()

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
      <p class="prose">Um arquivo com sua biblioteca, avaliações e gastos. Chega em breve.</p>
      <div class="actions">
        <button type="button" disabled>Exportar</button>
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
