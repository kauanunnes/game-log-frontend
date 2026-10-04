<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import type { LibraryQuery } from '@/api/users'
import GameCard from '@/components/GameCard.vue'
import { formatNumber } from '@/lib/format'
import { useProfileSource } from '@/lib/profileSource'

/** Visão geral: favoritos, o que está jogando, o que mudou por último e um resumo dos números. */
const route = useRoute()
const username = computed(() => String(route.params.username))
const source = useProfileSource(username)

const shelf = (name: string, query: LibraryQuery) =>
  useQuery({
    queryKey: ['profile', username, source.isOwner, 'overview', name],
    queryFn: () => source.library({ ...query, size: 6 }),
  })

const { data: favorites } = shelf('favorites', { favorite: true })
const { data: playing } = shelf('playing', { status: ['PLAYING'] })
const { data: recent } = shelf('recent', {})
const { data: stats } = useQuery({
  queryKey: ['profile', username, source.isOwner, 'stats'],
  queryFn: source.stats,
})

const shelves = computed(() => [
  { title: 'Favoritos', tab: 'profile-favorites', entries: favorites.value?.content ?? [] },
  { title: 'Jogando agora', tab: 'profile-playing', entries: playing.value?.content ?? [] },
  { title: 'Atualizados por último', tab: undefined, entries: recent.value?.content ?? [] },
])
</script>

<template>
  <div class="overview">
    <p v-if="stats" class="prose summary">
      {{ formatNumber(stats.total) }} {{ stats.total === 1 ? 'jogo' : 'jogos' }} na biblioteca ·
      {{ formatNumber(stats.hoursPlayed) }} horas jogadas
      <template v-if="stats.averageRating != null">
        · nota média {{ stats.averageRating.toLocaleString('pt-BR') }}
      </template>
    </p>

    <template v-for="item in shelves" :key="item.title">
      <fieldset v-if="item.entries.length">
        <legend>{{ item.title }}</legend>
        <ul class="grid">
          <li v-for="entry in item.entries" :key="entry.game.id">
            <GameCard
              :game="entry.game"
              :rating="entry.review?.rating ?? null"
              :favorite="entry.favorite"
            />
          </li>
        </ul>
        <RouterLink v-if="item.tab" class="more" :to="{ name: item.tab, params: { username } }">
          Ver todos
        </RouterLink>
      </fieldset>
    </template>

    <p v-if="stats && stats.total === 0" class="prose empty">
      Nenhum jogo na biblioteca ainda.
      <RouterLink v-if="source.isOwner.value" :to="{ name: 'explore' }">Explore jogos</RouterLink>
    </p>
  </div>
</template>

<style scoped>
.overview {
  display: grid;
  gap: 12px;
}

.summary {
  margin: 0;
}

.more {
  justify-self: end;
  font-size: 14px;
}

.empty {
  padding: 32px 0;
  text-align: center;
}
</style>
