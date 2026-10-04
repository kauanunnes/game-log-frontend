<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { resetPassword } from '@/api/auth'
import AppWindow from '@/components/AppWindow.vue'
import { useSubmit } from '@/lib/useSubmit'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))
const form = reactive({ next: '', confirmation: '' })

const { busy, error, done, submit } = useSubmit(async () => {
  await resetPassword(token.value, form.next)
  // A troca encerra todas as sessões, inclusive uma aberta neste navegador.
  if (auth.isLoggedIn) await auth.logout()
  await router.push({
    name: 'login',
    state: { notice: 'Senha redefinida. Entre com a senha nova.' },
  })
})

function send() {
  if (form.next === form.confirmation) return submit()
  done.value = false
  error.value = 'A confirmação não é igual à nova senha.'
}
</script>

<template>
  <AppWindow title="Nova senha.exe" class="narrow">
    <p v-if="!token" class="prose">
      Este link está incompleto.
      <RouterLink :to="{ name: 'forgot-password' }">Peça outro</RouterLink>.
    </p>
    <form v-else class="form" @submit.prevent="send">
      <label>
        Nova senha
        <input
          v-model="form.next"
          type="password"
          autocomplete="new-password"
          minlength="8"
          maxlength="64"
          required
        />
      </label>
      <label>
        Repita a nova senha
        <input v-model="form.confirmation" type="password" autocomplete="new-password" required />
        <small class="hint">Todas as sessões abertas são encerradas.</small>
      </label>
      <p v-if="error" class="error" role="alert">
        {{ error }}
        <RouterLink v-if="error.includes('link')" :to="{ name: 'forgot-password' }">
          Peça outro link.
        </RouterLink>
      </p>
      <div class="actions">
        <button type="submit" :disabled="busy">Salvar senha</button>
      </div>
    </form>
  </AppWindow>
</template>
