<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { listMyLibrary, setFeatured } from '@/api/me'
import { useSubmit } from '@/lib/useSubmit'
import { useAuthStore } from '@/stores/auth'
import type { GameSummary } from '@/types/api'

const MAX_FEATURED = 5

const props = defineProps<{ current: GameSummary[] }>()
const emit = defineEmits<{ saved: [featured: GameSummary[]]; cancel: [] }>()

const auth = useAuthStore()
const { data: favorites } = useQuery({
  queryKey: ['me', computed(() => auth.user?.id), 'favorites', 'all'],
  queryFn: () => listMyLibrary({ favorite: true, size: 50 }),
})

const chosen = ref([...props.current])
const chosenIds = computed(() => new Set(chosen.value.map((game) => game.id)))

/** Sobe ou desce um destaque; os botões funcionam também no teclado. */
function move(index: number, delta: number) {
  const next = [...chosen.value]
  const [moved] = next.splice(index, 1)
  if (moved) next.splice(index + delta, 0, moved)
  chosen.value = next
}

const {
  busy,
  error,
  submit: save,
} = useSubmit(async () => {
  emit('saved', await setFeatured(chosen.value.map((game) => game.id)))
})
</script>

<template>
  <form class="form editor" @submit.prevent="save">
    <fieldset>
      <legend>Em destaque ({{ chosen.length }}/{{ MAX_FEATURED }})</legend>
      <p v-if="!chosen.length" class="hint">Escolha abaixo, entre os seus favoritos.</p>
      <ol v-else class="rows">
        <li v-for="(game, index) in chosen" :key="game.id">
          <span class="position">{{ index + 1 }}</span>
          <span class="name">{{ game.title }}</span>
          <span class="moves">
            <button
              type="button"
              :disabled="index === 0"
              :aria-label="`Subir ${game.title}`"
              @click="move(index, -1)"
            >
              ▲
            </button>
            <button
              type="button"
              :disabled="index === chosen.length - 1"
              :aria-label="`Descer ${game.title}`"
              @click="move(index, 1)"
            >
              ▼
            </button>
            <button
              type="button"
              :aria-label="`Tirar ${game.title}`"
              @click="chosen.splice(index, 1)"
            >
              ✕
            </button>
          </span>
        </li>
      </ol>
    </fieldset>

    <fieldset>
      <legend>Seus favoritos</legend>
      <p v-if="favorites && !favorites.content.length" class="hint">
        Marque jogos como favoritos para escolher destaques.
      </p>
      <ul v-else-if="favorites" class="rows">
        <li v-for="entry in favorites.content" :key="entry.game.id">
          <span class="name">{{ entry.game.title }}</span>
          <button
            type="button"
            :disabled="chosenIds.has(entry.game.id) || chosen.length >= MAX_FEATURED"
            @click="chosen.push(entry.game)"
          >
            {{ chosenIds.has(entry.game.id) ? 'Em destaque' : 'Destacar' }}
          </button>
        </li>
      </ul>
    </fieldset>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <div class="actions">
      <button type="button" @click="emit('cancel')">Cancelar</button>
      <button type="submit" :disabled="busy">Salvar destaques</button>
    </div>
  </form>
</template>

<style scoped>
.rows {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.rows li {
  display: flex;
  align-items: center;
  gap: 8px;
}

.position {
  width: 2ch;
  font: 14px var(--font-display);
  text-align: right;
}

.name {
  flex: 1;
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
</style>
