<script setup lang="ts">
import { computed } from 'vue'
import type { ListSummary } from '@/types/api'

const props = defineProps<{ list: ListSummary; username: string }>()

/** Mosaico 2×2 com as capas dos quatro primeiros jogos; o que faltar fica pontilhado. */
const tiles = computed(() =>
  Array.from({ length: 4 }, (_, index) => props.list.preview[index]?.coverUrl ?? null),
)
</script>

<template>
  <RouterLink class="list-card" :to="{ name: 'list', params: { username, listId: list.id } }">
    <span class="mosaic" aria-hidden="true">
      <span v-for="(cover, index) in tiles" :key="index" class="tile">
        <img v-if="cover" :src="cover" alt="" loading="lazy" />
      </span>
    </span>
    <strong class="title">{{ list.title }}</strong>
    <small class="hint">
      {{ list.itemCount }} {{ list.itemCount === 1 ? 'jogo' : 'jogos' }}
      <template v-if="list.visibility === 'PRIVATE'"> · privada</template>
    </small>
  </RouterLink>
</template>

<style scoped>
.list-card {
  display: grid;
  align-content: start;
  gap: 6px;
  padding: 6px;
  background: var(--surface);
  box-shadow: var(--raised);
  color: var(--text);
  text-decoration: none;
}

.list-card:is(:hover, :focus-visible) .title {
  background: var(--navy);
  color: var(--white);
}

.mosaic {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
  aspect-ratio: 1;
  padding: 2px;
  box-shadow: var(--sunken);
}

.tile {
  overflow: hidden;
  background: repeating-conic-gradient(var(--teal) 0 25%, var(--navy) 0 50%) 0 0 / 4px 4px;
}

.tile img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.title {
  overflow-wrap: anywhere;
}
</style>
