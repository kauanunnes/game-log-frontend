<script setup lang="ts">
import type { GameSummary } from '@/types/api'

/** Capa pequena à esquerda e o conteúdo ao lado, como nas avaliações do Início e no feed. */
defineProps<{ game: GameSummary }>()
</script>

<template>
  <div class="game-row">
    <!-- A capa repete o link do conteúdo; fica fora do teclado e do leitor de tela. -->
    <RouterLink
      class="cover"
      :to="{ name: 'game', params: { slug: game.slug } }"
      tabindex="-1"
      aria-hidden="true"
    >
      <img v-if="game.coverUrl" :src="game.coverUrl" alt="" loading="lazy" />
    </RouterLink>
    <div class="content"><slot /></div>
  </div>
</template>

<style scoped>
.game-row {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  align-items: start;
  gap: 10px;
}

.cover {
  aspect-ratio: 3 / 4;
  background: repeating-conic-gradient(var(--teal) 0 25%, var(--navy) 0 50%) 0 0 / 4px 4px;
  box-shadow: var(--sunken);
}

.cover img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.content {
  display: grid;
  gap: 6px;
}
</style>
