<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { searchGames } from '@/api/games'
import { deleteList, setListItems, updateList } from '@/api/me'
import { useSubmit } from '@/lib/useSubmit'
import type { GameList, GameSummary } from '@/types/api'

const MAX_ITEMS = 100

const props = defineProps<{ list: GameList }>()
const emit = defineEmits<{ saved: [list: GameList]; cancel: []; deleted: [] }>()

const form = reactive({
  title: props.list.title,
  description: props.list.description ?? '',
  private: props.list.visibility === 'PRIVATE',
})
const items = ref(props.list.items.map((item) => ({ game: item.game, note: item.note ?? '' })))

/** Sobe ou desce um jogo; os botões funcionam também no teclado. */
function move(index: number, delta: number) {
  const next = [...items.value]
  const [moved] = next.splice(index, 1)
  if (moved) next.splice(index + delta, 0, moved)
  items.value = next
}

const drop = (index: number) => items.value.splice(index, 1)

/** Busca no catálogo para adicionar; dispara no Enter, como no Explorar. */
const query = ref('')
const searched = ref('')
const { data: results, isFetching } = useQuery({
  queryKey: ['games', 'list-search', searched],
  queryFn: () => searchGames({ q: searched.value, size: 8 }),
  enabled: computed(() => searched.value.length > 0),
})
const inList = computed(() => new Set(items.value.map((item) => item.game.id)))

function add(game: GameSummary) {
  if (!inList.value.has(game.id) && items.value.length < MAX_ITEMS) {
    items.value.push({ game, note: '' })
  }
}

const {
  busy,
  error,
  submit: save,
} = useSubmit(async () => {
  await updateList(props.list.id, {
    title: form.title,
    description: form.description || null,
    visibility: form.private ? 'PRIVATE' : 'PUBLIC',
  })
  const saved = await setListItems(
    props.list.id,
    items.value.map((item) => ({ gameId: item.game.id, note: item.note || null })),
  )
  emit('saved', saved)
})

const {
  busy: deleting,
  error: deleteError,
  submit: destroy,
} = useSubmit(async () => {
  await deleteList(props.list.id)
  emit('deleted')
})

function confirmDelete() {
  if (window.confirm(`Excluir a lista "${props.list.title}"? Não dá para desfazer.`)) {
    return destroy()
  }
}
</script>

<template>
  <form class="form editor" @submit.prevent="save">
    <label>
      Título
      <input v-model="form.title" maxlength="80" required />
    </label>
    <label>
      Descrição
      <textarea v-model="form.description" rows="3" maxlength="500" />
    </label>
    <label class="choice"
      ><input v-model="form.private" type="checkbox" /> Só eu vejo esta lista</label
    >

    <fieldset>
      <legend>Jogos ({{ items.length }}/{{ MAX_ITEMS }})</legend>
      <p v-if="!items.length" class="hint">Busque abaixo para adicionar o primeiro.</p>
      <ol v-else class="items">
        <li v-for="(item, index) in items" :key="item.game.id">
          <span class="position">{{ index + 1 }}</span>
          <span class="name">{{ item.game.title }}</span>
          <input
            v-model="item.note"
            class="note"
            maxlength="300"
            placeholder="Nota (opcional)"
            :aria-label="`Nota sobre ${item.game.title}`"
          />
          <span class="moves">
            <button
              type="button"
              :disabled="index === 0"
              :aria-label="`Subir ${item.game.title}`"
              @click="move(index, -1)"
            >
              ▲
            </button>
            <button
              type="button"
              :disabled="index === items.length - 1"
              :aria-label="`Descer ${item.game.title}`"
              @click="move(index, 1)"
            >
              ▼
            </button>
            <button type="button" :aria-label="`Tirar ${item.game.title}`" @click="drop(index)">
              ✕
            </button>
          </span>
        </li>
      </ol>

      <div class="search" role="search">
        <input
          v-model="query"
          type="search"
          placeholder="Buscar jogo para adicionar"
          aria-label="Buscar jogo para adicionar"
          @keydown.enter.prevent="searched = query.trim()"
        />
        <button type="button" @click="searched = query.trim()">Buscar</button>
      </div>
      <p v-if="isFetching" class="hint">Buscando…</p>
      <ul v-else-if="searched && results" class="results">
        <li v-for="game in results.content" :key="game.id">
          <span>
            {{ game.title }}
            <small v-if="game.releaseYear" class="hint">({{ game.releaseYear }})</small>
          </span>
          <button
            type="button"
            :disabled="inList.has(game.id) || items.length >= MAX_ITEMS"
            @click="add(game)"
          >
            {{ inList.has(game.id) ? 'Na lista' : 'Adicionar' }}
          </button>
        </li>
        <li v-if="!results.content.length" class="hint">Nenhum jogo encontrado.</li>
      </ul>
    </fieldset>

    <p v-if="error || deleteError" class="error" role="alert">{{ error ?? deleteError }}</p>
    <div class="actions">
      <button type="button" class="delete" :disabled="deleting" @click="confirmDelete">
        Excluir lista
      </button>
      <button type="button" @click="emit('cancel')">Cancelar</button>
      <button type="submit" :disabled="busy">Salvar</button>
    </div>
  </form>
</template>

<style scoped>
.items,
.results {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.items li {
  display: grid;
  grid-template-columns: 2ch minmax(0, 1fr) minmax(0, 1.4fr) auto;
  align-items: center;
  gap: 8px;
}

.position {
  font: 14px var(--font-display);
  text-align: right;
}

.name {
  overflow-wrap: anywhere;
}

.moves {
  display: flex;
  gap: 2px;
}

.moves button {
  min-width: 0;
  padding: 2px 8px;
}

.search {
  display: flex;
  gap: 6px;
}

.search input {
  flex: 1;
  min-width: 0;
}

.results li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.delete {
  margin-right: auto;
}

/* No celular, a nota vai para a linha de baixo. */
@media (max-width: 560px) {
  .items li {
    grid-template-columns: 2ch minmax(0, 1fr) auto;
  }

  .note {
    grid-column: 2 / -1;
    grid-row: 2;
  }
}
</style>
