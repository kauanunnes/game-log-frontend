<script setup lang="ts">
import { useRoute } from 'vue-router'

defineProps<{ page: number; totalPages: number }>()

const route = useRoute()
const to = (page: number) => ({ query: { ...route.query, page: page > 1 ? page : undefined } })
</script>

<template>
  <nav class="page-nav" aria-label="Páginas">
    <RouterLink v-if="page > 1" class="button" :to="to(page - 1)">◀ Anterior</RouterLink>
    <button v-else type="button" disabled>◀ Anterior</button>
    <span>Página {{ page }} de {{ totalPages }}</span>
    <RouterLink v-if="page < totalPages" class="button" :to="to(page + 1)">Próxima ▶</RouterLink>
    <button v-else type="button" disabled>Próxima ▶</button>
  </nav>
</template>

<style scoped>
.page-nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px 12px;
}

span {
  font: 14px var(--font-text);
}
</style>
