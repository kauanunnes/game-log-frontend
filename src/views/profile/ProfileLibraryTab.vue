<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import type { LibraryQuery } from '@/api/users'
import ErrorMessage from '@/components/ErrorMessage.vue'
import GameCard from '@/components/GameCard.vue'
import GameCardSkeleton from '@/components/GameCardSkeleton.vue'
import LibraryEntryDialog from '@/components/LibraryEntryDialog.vue'
import PageNav from '@/components/PageNav.vue'
import { useProfileSource } from '@/lib/profileSource'
import { profileTabs } from '@/router/tabs'
import type { EntryStatus, LibraryEntry } from '@/types/api'

/** Todas as abas de jogos do perfil usam esta lista; muda só o filtro. */
const props = defineProps<{ statuses?: EntryStatus[]; favorites?: boolean; variants?: boolean }>()

const SORTS = [
  { value: 'updatedAt,desc', label: 'Atualizados por último' },
  { value: 'rating,desc', label: 'Maior nota' },
  { value: 'title,asc', label: 'Título (A–Z)' },
  { value: 'finishedOn,desc', label: 'Terminados por último' },
  { value: 'createdAt,desc', label: 'Adicionados por último' },
]

/** Aba Jogados: "Todos / Zerados / Abandonados". */
const VARIANTS: Record<string, { label: string; query: LibraryQuery }> = {
  todos: { label: 'Todos', query: {} },
  zerados: { label: 'Zerados', query: { status: ['PLAYED'], completed: true } },
  abandonados: { label: 'Abandonados', query: { status: ['DROPPED'] } },
}

const route = useRoute()
const router = useRouter()
const username = computed(() => String(route.params.username))
const source = useProfileSource(username)

const one = (value: unknown) => (typeof value === 'string' ? value : undefined)
const variant = computed(() => {
  const name = one(route.query.filtro)
  return props.variants && name && name in VARIANTS ? name : 'todos'
})
const sort = computed(() => {
  const value = one(route.query.sort)
  return SORTS.some((option) => option.value === value) ? value! : 'updatedAt,desc'
})
const page = computed(() => Math.max(1, Number(route.query.page) || 1))

const query = computed<LibraryQuery>(() => ({
  status: props.statuses,
  favorite: props.favorites || undefined,
  ...(props.variants ? VARIANTS[variant.value]?.query : {}),
  sort: sort.value,
  page: page.value - 1,
  size: 24,
}))

const { data, error, isPending, isPlaceholderData, refetch } = useQuery({
  queryKey: ['profile', username, source.isOwner, 'library', query],
  queryFn: () => source.library(query.value),
  placeholderData: keepPreviousData,
})

const tabLabel = computed(() => profileTabs.find((tab) => tab.name === route.name)?.label ?? '')
const showStatus = computed(() => props.favorites || (props.statuses?.length ?? 0) > 1)

function change(key: 'sort' | 'filtro', value: string) {
  router.push({ query: { ...route.query, [key]: value, page: undefined } })
}

/** O dono edita direto da lista. */
const editing = ref<LibraryEntry | null>(null)
const editedGame = computed(() => editing.value?.game ?? { id: 0, slug: '', title: '' })
</script>

<template>
  <div class="toolbar">
    <div v-if="variants" class="variants" role="group" aria-label="Filtrar">
      <button
        v-for="(option, key) in VARIANTS"
        :key="key"
        type="button"
        :aria-pressed="variant === key"
        @click="change('filtro', key)"
      >
        {{ option.label }}
      </button>
    </div>
    <label class="sort">
      Ordenar por
      <select :value="sort" @change="change('sort', ($event.target as HTMLSelectElement).value)">
        <option v-for="option in SORTS" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </label>
  </div>

  <ErrorMessage v-if="error" @retry="refetch()">
    Não foi possível carregar os jogos. {{ error.message }}
  </ErrorMessage>
  <ul v-else-if="isPending" class="grid">
    <li v-for="n in 6" :key="n"><GameCardSkeleton /></li>
  </ul>
  <p v-else-if="!data?.content.length" class="prose empty">
    Nada em {{ tabLabel }} ainda.
    <RouterLink v-if="source.isOwner.value" :to="{ name: 'explore' }">Explore jogos</RouterLink>
  </p>
  <ul v-else class="grid" :class="{ stale: isPlaceholderData }">
    <li v-for="entry in data.content" :key="entry.game.id">
      <GameCard
        :game="entry.game"
        :rating="entry.review?.rating ?? null"
        :status="showStatus ? entry.status : undefined"
        :favorite="entry.favorite"
      />
      <button v-if="source.isOwner.value" type="button" class="edit" @click="editing = entry">
        Editar
      </button>
    </li>
  </ul>
  <PageNav
    v-if="data && data.page.totalPages > 1"
    class="pages"
    :page="page"
    :total-pages="data.page.totalPages"
  />

  <LibraryEntryDialog
    v-if="source.isOwner.value"
    :open="editing !== null"
    :game="editedGame"
    :entry="editing"
    @close="editing = null"
  />
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: 8px 16px;
  margin-bottom: 12px;
}

.variants {
  display: flex;
  gap: 4px;
}

.variants button[aria-pressed='true'] {
  box-shadow: var(--pressed);
  font-weight: 700;
}

.sort {
  display: grid;
  gap: 2px;
  margin-left: auto;
  font-size: 14px;
}

.grid > li {
  align-content: start;
  gap: 4px;
}

.edit {
  min-height: 24px;
  font-size: 13px;
}

.stale {
  opacity: 0.5;
}

.empty {
  padding: 32px 0;
  text-align: center;
}

.pages {
  margin-top: 12px;
}
</style>
