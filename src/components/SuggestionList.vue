<script setup lang="ts">
import type { Suggestion } from '@/types/api'
import GameCard from './GameCard.vue'

defineProps<{ suggestions: Suggestion[] }>()
</script>

<template>
  <ul class="grid">
    <li v-for="suggestion in suggestions" :key="suggestion.game.id">
      <GameCard :game="suggestion.game" />
      <p class="reason">{{ suggestion.reason }}</p>
    </li>
  </ul>
</template>

<style scoped>
li {
  align-content: start;
  gap: 4px;
}

.reason {
  margin: 0;
  color: var(--muted);
  font: 12px / 1.4 var(--font-text);
}
</style>
