<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import type { LibraryQuery } from '@/api/users'
import FeaturedEditor from '@/components/FeaturedEditor.vue'
import GameCard from '@/components/GameCard.vue'
import { formatNumber } from '@/lib/format'
import { useProfileSource } from '@/lib/profileSource'

/** Visão geral: destaques, favoritos, o que está jogando, o que mudou por último e um resumo dos números. */
const route = useRoute()
const username = computed(() => String(route.params.username))
const source = useProfileSource(username)
const queryClient = useQueryClient()

/** Os destaques vêm no cabeçalho; a mesma chave reaproveita o que o perfil já buscou. */
const { data: profile } = useQuery({
  queryKey: ['profile', username, source.isOwner, 'header'],
  queryFn: source.header,
})
const featured = computed(() => profile.value?.featured ?? [])
const editing = ref(false)

function saved() {
  editing.value = false
  void queryClient.invalidateQueries({ queryKey: ['profile', username.value] })
}

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
    <FeaturedEditor v-if="editing" :current="featured" @saved="saved" @cancel="editing = false" />
    <fieldset v-else-if="featured.length || source.isOwner.value" class="featured">
      <legend>Em destaque</legend>
      <ul v-if="featured.length" class="grid">
        <li v-for="game in featured" :key="game.id"><GameCard :game="game" /></li>
      </ul>
      <p v-else class="prose hint">Escolha até 5 favoritos para o topo do seu perfil.</p>
      <button v-if="source.isOwner.value" type="button" class="choose" @click="editing = true">
        Escolher destaques
      </button>
    </fieldset>

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

.more,
.choose {
  justify-self: end;
  font-size: 14px;
}

.featured .hint {
  margin: 0;
}

.empty {
  padding: 32px 0;
  text-align: center;
}
</style>
