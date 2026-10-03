<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { updateMySettings } from '@/api/me'
import { currencyOptions } from '@/lib/format'
import { useSubmit } from '@/lib/useSubmit'
import { useAuthStore } from '@/stores/auth'
import type { Me } from '@/types/api'

const props = defineProps<{ me: Me }>()
const auth = useAuthStore()
const queryClient = useQueryClient()

const fromMe = (me: Me) => ({
  private: me.profileVisibility === 'PRIVATE',
  showSpending: me.showSpending ?? false,
  defaultCurrency: me.defaultCurrency ?? 'BRL',
})
const form = reactive(fromMe(props.me))
const dirty = computed(() => JSON.stringify(form) !== JSON.stringify(fromMe(props.me)))

const { busy, error, done, submit } = useSubmit(async () => {
  auth.user = await updateMySettings({
    profileVisibility: form.private ? 'PRIVATE' : 'PUBLIC',
    showSpending: form.showSpending,
    defaultCurrency: form.defaultCurrency,
  })
  // O que visitantes veem e os números da comunidade mudam junto.
  void queryClient.invalidateQueries()
})
</script>

<template>
  <form class="form" @submit.prevent="submit">
    <label class="choice"> <input v-model="form.private" type="checkbox" /> Perfil privado </label>
    <small class="hint">
      Quem visita vê só seu nome e username. Suas notas e avaliações saem das páginas dos jogos e
      dos números da comunidade.
    </small>
    <label class="choice">
      <input v-model="form.showSpending" type="checkbox" /> Mostrar gastos
    </label>
    <small class="hint">Loja e valor pago aparecem no seu perfil público.</small>
    <label>
      Moeda padrão
      <select v-model="form.defaultCurrency">
        <option v-for="currency in currencyOptions(form.defaultCurrency)" :key="currency">
          {{ currency }}
        </option>
      </select>
      <small class="hint">Já vem escolhida quando você registra uma compra.</small>
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
</style>
