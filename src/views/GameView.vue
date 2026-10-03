<script setup lang="ts">
import { computed, toRef, watchEffect } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { ApiError } from '@/api/client'
import { getGame } from '@/api/games'
import AppWindow from '@/components/AppWindow.vue'
import ErrorMessage from '@/components/ErrorMessage.vue'
import UnderConstruction from '@/components/UnderConstruction.vue'
import { formatDate, formatNumber } from '@/lib/format'
import { kindLabel } from '@/lib/labels'

const props = defineProps<{ slug: string }>()
const slug = toRef(props, 'slug')

const {
  data: game,
  error,
  isPending,
  refetch,
} = useQuery({
  queryKey: ['game', slug],
  queryFn: () => getGame(slug.value),
})

const notFound = computed(
  () => error.value instanceof ApiError && error.value.problem.status === 404,
)

const facts = computed(() => {
  const value = game.value
  if (!value) return []
  const rows: [string, string[]][] = [
    ['Desenvolvimento', value.developers],
    ['Publicação', value.publishers],
    ['Franquia', value.franchises],
    ['Temas', value.themes],
    ['Modos', value.modes],
    ['Perspectiva', value.perspectives],
  ]
  return rows.filter(([, values]) => values.length)
})

watchEffect(() => {
  if (game.value) document.title = `${game.value.title} · Game Log`
})
</script>

<template>
  <AppWindow :title="`${game?.title ?? slug}.exe`">
    <nav class="toolbar">
      <RouterLink class="button" :to="{ name: 'explore' }">◀ Explorar</RouterLink>
    </nav>

    <div v-if="notFound" class="not-found">
      <span class="error-icon" aria-hidden="true">×</span>
      <p class="prose">
        Não existe jogo no endereço <b>{{ slug }}</b
        >. Ele pode ter mudado de nome no IGDB.
      </p>
      <RouterLink class="button" :to="{ name: 'explore' }">Buscar jogos</RouterLink>
    </div>

    <ErrorMessage v-else-if="error" @retry="refetch()">
      Não foi possível carregar o jogo. {{ error.message }}
    </ErrorMessage>

    <div v-else-if="isPending" class="game" aria-busy="true" aria-label="Carregando jogo">
      <div class="cover loading" />
      <div class="info">
        <span class="line" />
        <span class="line short" />
        <span class="line" />
      </div>
    </div>

    <template v-else-if="game">
      <article class="game">
        <div class="cover">
          <img v-if="game.coverUrl" :src="game.coverUrl" :alt="`Capa de ${game.title}`" />
          <span v-else aria-hidden="true">{{ game.title.slice(0, 2) }}</span>
        </div>

        <div class="info">
          <h2>{{ game.title }}</h2>
          <p class="prose meta">
            {{ game.releaseDate ? formatDate(game.releaseDate) : 'Sem data de lançamento' }}
            <template v-if="game.kind !== 'MAIN'"> · {{ kindLabel[game.kind] }}</template>
          </p>
          <p v-if="game.developers.length" class="prose meta">
            por {{ game.developers.join(', ') }}
          </p>

          <div v-if="game.igdbRating !== null" class="score">
            <span class="display" aria-hidden="true">{{ game.igdbRating }}</span>
            <span class="prose">
              <span class="visually-hidden">Nota {{ game.igdbRating }}</span> de 100 no IGDB
              <template v-if="game.igdbRatingCount">
                · {{ formatNumber(game.igdbRatingCount) }} avaliações
              </template>
            </span>
          </div>

          <ul v-if="game.genres.length" class="chips" aria-label="Gêneros">
            <li v-for="genre in game.genres" :key="genre.id">
              <RouterLink class="button" :to="{ name: 'explore', query: { genre: genre.id } }">
                {{ genre.name }}
              </RouterLink>
            </li>
          </ul>
          <ul v-if="game.platforms.length" class="chips" aria-label="Plataformas">
            <li v-for="platform in game.platforms" :key="platform.id">
              <RouterLink
                class="button"
                :to="{ name: 'explore', query: { platform: platform.id } }"
              >
                {{ platform.name }}
              </RouterLink>
            </li>
          </ul>
        </div>
      </article>

      <fieldset v-if="game.summary">
        <legend>Sobre</legend>
        <p class="prose summary">{{ game.summary }}</p>
      </fieldset>

      <fieldset v-if="facts.length">
        <legend>Ficha técnica</legend>
        <dl class="facts">
          <template v-for="[label, values] in facts" :key="label">
            <dt>{{ label }}</dt>
            <dd class="prose">{{ values.join(', ') }}</dd>
          </template>
        </dl>
      </fieldset>

      <UnderConstruction
        :items="['Números da comunidade', 'Avaliações', 'Adicionar à biblioteca']"
      />
    </template>

    <template v-if="game" #status>
      <span>{{ kindLabel[game.kind] }}</span>
      <span>Dados do <a href="https://www.igdb.com" target="_blank" rel="noopener">IGDB</a></span>
    </template>
  </AppWindow>
</template>

<style scoped>
.toolbar {
  margin-bottom: 12px;
}

.game {
  display: grid;
  grid-template-columns: minmax(140px, 240px) 1fr;
  align-items: start;
  gap: 16px;
  margin-bottom: 16px;
}

.cover {
  display: grid;
  place-items: center;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  padding: 2px;
  background: repeating-conic-gradient(var(--teal) 0 25%, var(--navy) 0 50%) 0 0 / 4px 4px;
  box-shadow: var(--sunken);
  color: var(--white);
  font: 40px var(--font-display);
  text-shadow: 3px 3px var(--black);
}

.cover.loading {
  background: none;
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info {
  display: grid;
  gap: 10px;
}

h2 {
  font-size: clamp(22px, 4vw, 32px);
  line-height: 1.15;
}

p {
  margin: 0;
}

.meta {
  color: var(--muted);
  font-size: 14px;
}

.score {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}

/* Visor de CD Player. */
.display {
  min-width: 3.4em;
  padding: 8px 10px;
  background: var(--black);
  box-shadow: var(--sunken);
  color: var(--star);
  font: 18px var(--font-display);
  text-align: right;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.chips .button {
  min-width: 0;
  min-height: 24px;
  padding: 1px 8px;
  font-size: 14px;
}

fieldset {
  margin-bottom: 16px;
}

.summary {
  white-space: pre-line;
}

.facts {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 6px 16px;
  margin: 0;
}

dt {
  font-weight: 700;
}

dd {
  margin: 0;
}

.not-found {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 16px;
  padding: 16px;
}

.not-found .button {
  grid-column: 1 / -1;
  justify-self: center;
}

.line {
  height: 16px;
  background: var(--light);
}

.short {
  width: 50%;
}

@media (max-width: 560px) {
  .game {
    grid-template-columns: 1fr;
  }

  .cover {
    justify-self: center;
    width: min(240px, 100%);
  }

  .facts {
    grid-template-columns: 1fr;
  }

  dd {
    margin-bottom: 6px;
  }
}
</style>
