<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { errorMessage } from '@/api/client'
import AppWindow from '@/components/AppWindow.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

/** Recado de quem mandou para cá, como a redefinição de senha. */
const notice: string | undefined = history.state?.notice

const form = reactive({ login: '', password: '' })
const error = ref<string | null>(null)
const loading = ref(false)

async function submit() {
  loading.value = true
  error.value = null
  try {
    await auth.login(form)
    const redirect = route.query.redirect
    await router.push(
      typeof redirect === 'string' && redirect.startsWith('/') ? redirect : { name: 'home' },
    )
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AppWindow title="Entrar.exe" class="narrow">
    <p v-if="notice" class="prose success" role="status">{{ notice }}</p>
    <form class="form" @submit.prevent="submit">
      <label>
        Usuário ou e-mail
        <input v-model="form.login" autocomplete="username" required />
      </label>
      <label>
        Senha
        <input v-model="form.password" type="password" autocomplete="current-password" required />
      </label>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <div class="actions">
        <button type="submit" :disabled="loading">Entrar</button>
      </div>
      <p class="prose">
        <RouterLink :to="{ name: 'forgot-password' }">Esqueci minha senha</RouterLink> · Não tem
        conta? <RouterLink :to="{ name: 'signup' }">Criar conta</RouterLink>
      </p>
    </form>
  </AppWindow>
</template>
