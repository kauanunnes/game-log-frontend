<script setup lang="ts">
import { useRoute } from 'vue-router'
import AppWindow from '@/components/AppWindow.vue'

const route = useRoute()
</script>

<template>
  <AppWindow title="Erro" class="narrow">
    <div class="message">
      <span class="icon" aria-hidden="true">×</span>
      <p class="prose">
        Não foi possível encontrar <b>{{ route.fullPath }}</b
        >. Verifique o endereço e tente de novo.
      </p>
    </div>
    <div class="actions">
      <RouterLink class="button" :to="{ name: 'home' }">OK</RouterLink>
    </div>
  </AppWindow>
</template>

<style scoped>
.message {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--red);
  box-shadow: 2px 2px var(--black);
  color: var(--white);
  font: 700 24px/1 var(--font-text);
}

p {
  margin: 0;
  overflow-wrap: anywhere;
}

.actions {
  justify-content: center;
}
</style>
