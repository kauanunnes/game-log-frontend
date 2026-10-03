<script setup lang="ts">
import { reactive } from 'vue'
import { changeMyPassword } from '@/api/me'
import { useSubmit } from '@/lib/useSubmit'
import { useAuthStore } from '@/stores/auth'
import type { Me } from '@/types/api'

const props = defineProps<{ me: Me }>()
const auth = useAuthStore()

const empty = { current: '', next: '', confirmation: '' }
const form = reactive({ ...empty })

const { busy, error, done, submit } = useSubmit(async () => {
  await changeMyPassword(form.current, form.next)
  // A troca encerra todas as sessões; esta entra de novo com a senha nova.
  await auth.login({ login: props.me.username, password: form.next })
  Object.assign(form, empty)
})

function send() {
  if (form.next === form.confirmation) return submit()
  done.value = false
  error.value = 'A confirmação não é igual à nova senha.'
}
</script>

<template>
  <div class="account">
    <fieldset>
      <legend>E-mail</legend>
      <p class="prose email">{{ me.email }}</p>
      <small class="hint">A troca de e-mail chega junto com a confirmação por e-mail.</small>
    </fieldset>

    <fieldset>
      <legend>Trocar senha</legend>
      <form class="form" @submit.prevent="send">
        <!-- Para o gerenciador de senhas saber de qual conta é a senha nova. -->
        <input
          :value="me.username"
          autocomplete="username"
          class="visually-hidden"
          tabindex="-1"
          aria-hidden="true"
          readonly
        />
        <label>
          Senha atual
          <input v-model="form.current" type="password" autocomplete="current-password" required />
        </label>
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
          <small class="hint">As outras sessões são encerradas; esta continua aberta.</small>
        </label>

        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <p v-else-if="done" class="success" role="status">Senha alterada.</p>
        <div class="actions">
          <button type="submit" :disabled="busy">Trocar senha</button>
        </div>
      </form>
    </fieldset>
  </div>
</template>

<style scoped>
.account {
  display: grid;
  gap: 12px;
}

.email {
  margin: 0;
  overflow-wrap: anywhere;
}
</style>
