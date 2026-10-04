<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { getSimilarGames } from '@/api/games'
import GameCard from './GameCard.vue'

const props = defineProps<{ slug: string }>()
const slug = toRef(props, 'slug')

const { data } = useQuery({
  queryKey: ['game-similar', slug],
  queryFn: () => getSimilarGames(slug.value),
})

/** Pelo conteúdo (embeddings) quando o jogo tem vetor; a lista do IGDB fica ao lado, para comparar. */
const source = ref<'content' | 'igdb'>('content')
watch(slug, () => (source.value = 'content'))

const byContent = computed(() => data.value?.byContent ?? [])
const byIgdb = computed(() => data.value?.byIgdb ?? [])
const comparing = computed(() => byContent.value.length > 0 && byIgdb.value.length > 0)
const showingContent = computed(
  () => byContent.value.length > 0 && (source.value === 'content' || !byIgdb.value.length),
)
const games = computed(() => (showingContent.value ? byContent.value : byIgdb.value))
</script>

<template>
  <fieldset v-if="games.length" class="similar">
    <legend>Jogos parecidos</legend>
    <div v-if="comparing" class="source" role="group" aria-label="Parecidos segundo">
      <button type="button" :aria-pressed="showingContent" @click="source = 'content'">
        Pelo conteúdo
      </button>
      <button type="button" :aria-pressed="!showingContent" @click="source = 'igdb'">
        Pelo IGDB
      </button>
    </div>
    <p class="hint">
      <template v-if="showingContent">
        Gêneros, temas e palavras-chave mais próximos, comparados por embeddings (modelo local, em
        teste).
      </template>
      <template v-else>A lista de jogos parecidos do IGDB.</template>
    </p>
    <ul class="grid">
      <li v-for="game in games" :key="game.id">
        <GameCard :game="game" />
      </li>
    </ul>
  </fieldset>
</template>

<style scoped>
.source {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}

.source button[aria-pressed='true'] {
  box-shadow: var(--pressed);
  font-weight: bold;
}

.hint {
  margin: 0 0 12px;
}
</style>
