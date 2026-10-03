<script setup lang="ts">
import TaskBar from '@/components/TaskBar.vue'
import UserWindow from '@/components/UserWindow.vue'
</script>

<template>
  <div class="desktop">
    <aside class="side" aria-label="Sua conta"><UserWindow /></aside>
    <main class="main"><RouterView /></main>
  </div>
  <TaskBar />
</template>

<style scoped>
/* Duas janelas lado a lado: a da conta fica parada à esquerda enquanto a principal rola. */
.desktop {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  align-items: start;
  gap: 16px;
  max-width: 1320px;
  margin: 0 auto;
  padding: 24px 16px;
}

.side {
  position: sticky;
  top: 24px;
}

.main {
  display: grid;
  gap: 16px;
  min-width: 0;
}

/* No celular, a janela da conta desce para depois do conteúdo. */
@media (max-width: 860px) {
  .desktop {
    grid-template-columns: minmax(0, 1fr);
  }

  .side {
    position: static;
    order: 1;
  }
}
</style>
