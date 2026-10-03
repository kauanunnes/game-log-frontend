<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { ApiError } from '@/api/client'
import { listGenres, listPlatforms, searchGames } from '@/api/games'
import AppWindow from '@/components/AppWindow.vue'
import ErrorMessage from '@/components/ErrorMessage.vue'
import GameCard from '@/components/GameCard.vue'
import GameCardSkeleton from '@/components/GameCardSkeleton.vue'
import PageNav from '@/components/PageNav.vue'
import {
  MAX_YEAR,
  MIN_YEAR,
  effectiveSort,
  parseFilters,
  sortOptions,
  toQuery,
  type GameFilters,
} from '@/lib/gameFilters'
import { sortLabel } from '@/lib/labels'
import type { GameSort } from '@/types/api'

const PAGE_SIZE = 24

const route = useRoute()
const router = useRouter()
const filters = computed(() => parseFilters(route.query))

/** Rascunho do formulário: a URL só muda ao buscar ou ao trocar um filtro. */
const form = ref<GameFilters>({ ...filters.value })
watch(filters, (value) => (form.value = { ...value }))

const sort = computed({
  get: () => effectiveSort(form.value),
  set: (value: GameSort) => (form.value.sort = value),
})

const { data: genres } = useQuery({ queryKey: ['genres'], queryFn: listGenres })
const { data: platforms } = useQuery({ queryKey: ['platforms'], queryFn: listPlatforms })
const { data, error, isPending, isFetching, isPlaceholderData, refetch } = useQuery({
  queryKey: ['games', filters],
  queryFn: ({ signal }) =>
    searchGames({ ...filters.value, page: filters.value.page - 1, size: PAGE_SIZE }, signal),
  placeholderData: keepPreviousData,
})

const count = computed(() => {
  const total = data.value?.page.totalElements ?? 0
  if (total === 0) return 'Nenhum jogo'
  return total === 1 ? '1 jogo' : `${total.toLocaleString('pt-BR')} jogos`
})
const hasFilters = computed(() => Object.keys(toQuery({ ...filters.value, page: 1 })).length > 0)
const errorText = computed(() =>
  error.value instanceof ApiError ? error.value.message : 'Sem conexão com o servidor.',
)

function search() {
  router.push({ query: toQuery({ ...form.value, page: 1 }) })
}

/** Selects e ano valem na hora; o requestSubmit respeita o min/max do ano. */
const submitForm = (event: Event) => (event.target as HTMLSelectElement).form?.requestSubmit()
</script>

<template>
  <AppWindow title="Explorar.exe">
    <form class="toolbar" role="search" @submit.prevent="search">
      <div class="search">
        <label class="visually-hidden" for="q">Buscar jogo</label>
        <input
          id="q"
          v-model.trim="form.q"
          type="search"
          maxlength="100"
          placeholder="Buscar jogo..."
        />
        <button type="submit">Buscar</button>
      </div>

      <fieldset class="filters">
        <legend>Filtros</legend>
        <label>
          Gênero
          <select v-model="form.genreId" @change="submitForm">
            <option :value="undefined">Todos</option>
            <option v-for="genre in genres" :key="genre.id" :value="genre.id">
              {{ genre.name }}
            </option>
          </select>
        </label>
        <label>
          Plataforma
          <select v-model="form.platformId" @change="submitForm">
            <option :value="undefined">Todas</option>
            <option v-for="platform in platforms" :key="platform.id" :value="platform.id">
              {{ platform.name }}
            </option>
          </select>
        </label>
        <label>
          Ano
          <input
            v-model.number="form.year"
            type="number"
            inputmode="numeric"
            :min="MIN_YEAR"
            :max="MAX_YEAR"
            placeholder="Todos"
            @change="submitForm"
          />
        </label>
        <label>
          Ordenar por
          <select v-model="sort" @change="submitForm">
            <option v-for="option in sortOptions(form.q)" :key="option" :value="option">
              {{ sortLabel[option] }}
            </option>
          </select>
        </label>
      </fieldset>
    </form>

    <section class="results" aria-label="Resultados" :aria-busy="isFetching">
      <ErrorMessage v-if="error" @retry="refetch()">
        Não foi possível carregar os jogos. {{ errorText }}
      </ErrorMessage>
      <ul v-else-if="isPending" class="grid">
        <li v-for="n in 12" :key="n"><GameCardSkeleton /></li>
      </ul>
      <div v-else-if="!data?.content.length" class="empty">
        <p class="prose">
          Nenhum jogo encontrado<template v-if="filters.q">
            para <mark>{{ filters.q }}</mark></template
          >. Tente outro nome ou menos filtros.
        </p>
        <RouterLink v-if="hasFilters" class="button" :to="{ name: 'explore' }">
          Limpar filtros
        </RouterLink>
      </div>
      <ul v-else class="grid" :class="{ stale: isPlaceholderData }">
        <li v-for="game in data.content" :key="game.id"><GameCard :game="game" /></li>
      </ul>
    </section>

    <PageNav
      v-if="data && data.page.totalPages > 1"
      class="pages"
      :page="filters.page"
      :total-pages="data.page.totalPages"
    />

    <template #status>
      <span role="status">{{ isFetching ? 'Buscando…' : count }}</span>
      <span>Dados do <a href="https://www.igdb.com" target="_blank" rel="noopener">IGDB</a></span>
    </template>
  </AppWindow>
</template>

<style scoped>
.toolbar {
  display: grid;
  gap: 12px;
  margin-bottom: 12px;
}

.search {
  display: flex;
  gap: 6px;
}

.search input {
  flex: 1;
  min-width: 0;
}

.filters {
  grid-template-columns: repeat(auto-fit, minmax(min(140px, calc(50% - 6px)), 1fr));
  gap: 8px 12px;
}

.filters label {
  display: grid;
  gap: 2px;
}

.filters :is(input, select) {
  width: 100%;
  min-width: 0;
}

.results {
  min-height: 280px;
  padding: 12px;
  background: var(--field);
  box-shadow: var(--sunken);
}

.results[aria-busy='true'] {
  cursor: progress;
}

ul.grid {
  margin: 0;
  padding: 0;
  list-style: none;
}

.grid > li {
  display: grid;
}

.stale {
  opacity: 0.5;
}

.empty {
  display: grid;
  justify-items: center;
  gap: 16px;
  padding: 48px 16px;
  text-align: center;
}

.empty p {
  max-width: 48ch;
  margin: 0;
}

.pages {
  margin-top: 12px;
}
</style>
