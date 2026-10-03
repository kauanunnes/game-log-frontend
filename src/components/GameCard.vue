<script setup lang="ts">
import { statusLabel } from '@/lib/labels'
import type { EntryStatus, GameSummary } from '@/types/api'
import StarRating from './StarRating.vue'

defineProps<{
  game: GameSummary
  rating?: number | null
  status?: EntryStatus
  favorite?: boolean
}>()
</script>

<template>
  <RouterLink class="card" :to="{ name: 'game', params: { slug: game.slug } }">
    <span class="cover">
      <img
        v-if="game.coverUrl"
        :src="game.coverUrl"
        :alt="`Capa de ${game.title}`"
        loading="lazy"
      />
      <span v-else aria-hidden="true">{{ game.title.slice(0, 2) }}</span>
      <span v-if="favorite" class="favorite" title="Favorito">♥</span>
    </span>
    <strong class="title">{{ game.title }}</strong>
    <small v-if="game.releaseYear">{{ game.releaseYear }}</small>
    <StarRating v-if="typeof rating === 'number'" :model-value="rating" readonly class="stars" />
    <mark v-if="status" class="status">{{ statusLabel[status] }}</mark>
  </RouterLink>
</template>

<style scoped>
.card {
  display: grid;
  align-content: start;
  gap: 4px;
  padding: 6px;
  background: var(--surface);
  box-shadow: var(--raised);
  color: var(--text);
  text-decoration: none;
}

.cover {
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  padding: 2px;
  background: repeating-conic-gradient(var(--teal) 0 25%, var(--navy) 0 50%) 0 0 / 4px 4px;
  box-shadow: var(--sunken);
  color: var(--white);
  font: 22px var(--font-display);
  text-shadow: 2px 2px var(--black);
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.favorite {
  position: absolute;
  top: 6px;
  right: 6px;
  color: var(--pink);
  font: 20px/1 var(--font-text);
}

.title {
  padding: 0 2px;
  line-height: 1.2;
}

.card:is(:hover, :focus-visible) .title {
  background: var(--navy);
  color: var(--white);
}

small {
  color: var(--muted);
  font: 12px var(--font-text);
}

.stars {
  font-size: 12px;
}

.status {
  justify-self: start;
  font: 12px var(--font-text);
}
</style>
