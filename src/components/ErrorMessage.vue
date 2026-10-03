<script setup lang="ts">
defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="error-message" role="alert">
    <span class="error-icon" aria-hidden="true">×</span>
    <p class="prose"><slot /></p>
    <button type="button" @click="$emit('retry')">Tentar de novo</button>
  </div>
</template>

<style scoped>
.error-message {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 16px;
  padding: 16px;
}

p {
  margin: 0;
}

button {
  grid-column: 1 / -1;
  justify-self: center;
}
</style>
