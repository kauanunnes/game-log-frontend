<script setup lang="ts">
import TaskBar from '@/components/TaskBar.vue'
</script>

<template>
  <main class="desktop">
    <RouterView />
  </main>
  <TaskBar />
</template>

<style scoped>
.desktop {
  display: grid;
  gap: 16px;
  max-width: 1040px;
  margin: 0 auto;
  padding: 24px 16px;
}
</style>
