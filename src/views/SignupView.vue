<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ApiError } from '@/api/client'
import AppWindow from '@/components/AppWindow.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const form = reactive({ username: '', email: '', password: '' })
const error = ref<string | null>(null)
const loading = ref(false)

async function submit() {
  loading.value = true
  error.value = null
  try {
    await auth.register(form)
    await router.push({ name: 'profile', params: { username: form.username } })
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Não foi possível conectar ao servidor.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AppWindow title="Criar conta.exe" class="narrow">
    <form class="form" @submit.prevent="submit">
      <label>
        Username
        <input
          v-model="form.username"
          autocomplete="username"
          pattern="[a-z0-9_]{3,20}"
          title="3 a 20 caracteres: letras minúsculas, números e _"
          required
        />
      </label>
      <label>
        E-mail
        <input v-model="form.email" type="email" autocomplete="email" required />
      </label>
      <label>
        Senha
        <input
          v-model="form.password"
          type="password"
          autocomplete="new-password"
          minlength="8"
          maxlength="64"
          required
        />
      </label>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <div class="actions">
        <button type="submit" :disabled="loading">Criar conta</button>
      </div>
      <p class="prose">Já tem conta? <RouterLink :to="{ name: 'login' }">Entrar</RouterLink></p>
    </form>
  </AppWindow>
</template>
