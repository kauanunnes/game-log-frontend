<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

defineProps<{ tabs: { label: string; to: RouteLocationRaw }[] }>()
</script>

<template>
  <nav class="tabs">
    <RouterLink
      v-for="tab in tabs"
      :key="tab.label"
      :to="tab.to"
      class="tab"
      exact-active-class="active"
    >
      {{ tab.label }}
    </RouterLink>
  </nav>
  <div class="panel"><slot /></div>
</template>

<style scoped>
/* Alinhadas por baixo, as inativas ficam 2px mais baixas que a ativa sem sair da faixa. */
.tabs {
  display: flex;
  align-items: flex-end;
  overflow-x: auto;
  padding: 2px 2px 0;
}

.tab {
  position: relative;
  padding: 4px 12px;
  background: var(--surface);
  box-shadow:
    inset 1px 1px var(--bevel-highlight),
    inset -1px 0 var(--bevel-dark),
    inset -2px 0 var(--bevel-shadow);
  color: var(--text);
  text-decoration: none;
  white-space: nowrap;
}

.tab.active {
  z-index: 1;
  padding-bottom: 6px;
  font-weight: 700;
}

.panel {
  padding: 12px;
  box-shadow:
    inset 1px 1px var(--bevel-highlight),
    inset -1px -1px var(--bevel-dark),
    inset -2px -2px var(--bevel-shadow);
}
</style>
