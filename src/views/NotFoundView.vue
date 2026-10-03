<script setup lang="ts">
import { useRoute } from 'vue-router'
import AppWindow from '@/components/AppWindow.vue'

const route = useRoute()
</script>

<template>
  <AppWindow title="Erro" class="narrow">
    <div class="message">
      <span class="error-icon" aria-hidden="true">×</span>
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

p {
  margin: 0;
  overflow-wrap: anywhere;
}

.actions {
  justify-content: center;
}
</style>
