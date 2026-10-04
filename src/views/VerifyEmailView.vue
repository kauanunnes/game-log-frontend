<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getMe, verifyEmail } from '@/api/auth'
import { ApiError, errorMessage } from '@/api/client'
import { resendVerification } from '@/api/me'
import AppWindow from '@/components/AppWindow.vue'
import { useSubmit } from '@/lib/useSubmit'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()

const state = ref<'checking' | 'confirmed' | 'failed'>('checking')
const failure = ref<string | null>(null)

/** O link confirma sozinho ao abrir; com a sessão aberta, a conta já mostra o e-mail confirmado. */
onMounted(async () => {
  const token = typeof route.query.token === 'string' ? route.query.token : ''
  try {
    await verifyEmail(token)
    state.value = 'confirmed'
    if (auth.isLoggedIn) auth.user = await getMe()
  } catch (e) {
    failure.value =
      e instanceof ApiError && e.problem.status === 422
        ? 'Este link não vale mais: ele pode ter expirado ou já ter sido usado.'
        : errorMessage(e)
    state.value = 'failed'
  }
})

const { busy, error, done, submit: resend } = useSubmit(resendVerification)
</script>

<template>
  <AppWindow title="Confirmar e-mail.exe" class="narrow">
    <p v-if="state === 'checking'" class="prose" role="status">Confirmando…</p>
    <template v-else-if="state === 'confirmed'">
      <p class="prose success" role="status">E-mail confirmado. Obrigado!</p>
      <RouterLink class="button" :to="{ name: 'home' }">Ir para o início</RouterLink>
    </template>
    <template v-else>
      <p class="error" role="alert">{{ failure }}</p>
      <template v-if="auth.isLoggedIn">
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <p v-else-if="done" class="prose success" role="status">Enviamos um novo link.</p>
        <button v-else type="button" :disabled="busy" @click="resend">Mandar outro link</button>
      </template>
      <p v-else class="prose">
        <RouterLink :to="{ name: 'login', query: { redirect: '/settings/account' } }">
          Entre
        </RouterLink>
        para pedir outro link.
      </p>
    </template>
  </AppWindow>
</template>

<style scoped>
p {
  margin: 0 0 12px;
}
</style>
