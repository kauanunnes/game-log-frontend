<script setup lang="ts">
import { computed, reactive } from 'vue'
import { updateMe, type ProfileChanges } from '@/api/me'
import { genderLabel } from '@/lib/labels'
import { useSubmit } from '@/lib/useSubmit'
import { useAuthStore } from '@/stores/auth'
import type { Me } from '@/types/api'

const props = defineProps<{ me: Me }>()
const auth = useAuthStore()

const fromMe = (me: Me) => ({
  displayName: me.displayName ?? '',
  username: me.username,
  bio: me.bio ?? '',
  gender: me.gender,
})
const form = reactive(fromMe(props.me))

/** Merge Patch: vão só os campos alterados, e o vazio vira null, que limpa. */
const changes = computed(() => {
  const saved = fromMe(props.me)
  const keys = (Object.keys(form) as (keyof typeof form)[]).filter(
    (key) => form[key] !== saved[key],
  )
  return Object.fromEntries(keys.map((key) => [key, form[key] || null])) as ProfileChanges
})
const dirty = computed(() => Object.keys(changes.value).length > 0)

const { busy, error, done, submit } = useSubmit(async () => {
  const me = await updateMe(changes.value)
  auth.user = me
  Object.assign(form, fromMe(me))
})
</script>

<template>
  <form class="form" @submit.prevent="submit">
    <label>
      Nome de exibição
      <input v-model="form.displayName" maxlength="50" :placeholder="me.username" />
    </label>
    <label>
      Username
      <input
        v-model="form.username"
        autocomplete="username"
        pattern="[a-z0-9_]{3,20}"
        title="3 a 20 caracteres: letras minúsculas, números e _"
        required
      />
      <small class="hint">O endereço do perfil muda junto: /u/{{ form.username }}</small>
    </label>
    <label>
      Bio
      <textarea v-model="form.bio" rows="4" maxlength="300" />
      <small class="hint counter">{{ form.bio.length }}/300</small>
    </label>
    <label>
      Gênero
      <select v-model="form.gender">
        <option :value="null">Prefiro não informar</option>
        <option v-for="(label, value) in genderLabel" :key="value" :value="value">
          {{ label }}
        </option>
      </select>
      <small class="hint">Opcional. Se informado, aparece no seu perfil público.</small>
    </label>

    <!-- O erro vale para as alterações pendentes; desfeitas, ele some. -->
    <p v-if="dirty && error" class="error" role="alert">{{ error }}</p>
    <p v-else-if="!dirty && done" class="success" role="status">Alterações salvas.</p>
    <div class="actions">
      <button type="submit" :disabled="busy || !dirty">Salvar</button>
    </div>
  </form>
</template>

<style scoped>
select {
  justify-self: start;
}

.counter {
  justify-self: end;
}
</style>
