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
.tabs {
  display: flex;
  overflow-x: auto;
  padding: 2px 2px 0;
}

.tab {
  position: relative;
  top: 2px;
  padding: 4px 12px;
  background: var(--surface);
  box-shadow:
    inset 1px 1px var(--white),
    inset -1px 0 var(--black),
    inset -2px 0 var(--gray);
  color: var(--text);
  text-decoration: none;
  white-space: nowrap;
}

.tab.active {
  z-index: 1;
  top: 0;
  padding-bottom: 6px;
  font-weight: 700;
}

.panel {
  padding: 12px;
  box-shadow:
    inset 1px 1px var(--white),
    inset -1px -1px var(--black),
    inset -2px -2px var(--gray);
}
</style>
