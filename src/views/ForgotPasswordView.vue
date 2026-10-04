<script setup lang="ts">
import { ref } from 'vue'
import { forgotPassword } from '@/api/auth'
import AppWindow from '@/components/AppWindow.vue'
import { useSubmit } from '@/lib/useSubmit'

const email = ref('')
const { busy, error, done, submit } = useSubmit(() => forgotPassword(email.value))
</script>

<template>
  <AppWindow title="Esqueci a senha.exe" class="narrow">
    <!-- A API responde igual exista a conta ou não, e a tela também. -->
    <p v-if="done" class="prose success" role="status">
      Se esse e-mail tiver conta, enviamos um link para criar uma senha nova. Ele vale por 1 hora.
    </p>
    <form v-else class="form" @submit.prevent="submit">
      <p class="prose intro">
        Informe o e-mail da conta e enviamos um link para criar uma senha nova.
      </p>
      <label>
        E-mail
        <input v-model="email" type="email" autocomplete="email" required />
      </label>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <div class="actions">
        <button type="submit" :disabled="busy">Enviar link</button>
      </div>
    </form>
    <p class="prose back">
      Lembrou? <RouterLink :to="{ name: 'login' }">Voltar para o login</RouterLink>
    </p>
  </AppWindow>
</template>

<style scoped>
.intro,
.back {
  margin: 0;
}

.back {
  margin-top: 12px;
}
</style>
