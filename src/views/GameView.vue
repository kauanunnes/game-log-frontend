<script setup lang="ts">
import { computed, toRef, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { ApiError } from '@/api/client'
import { getGame, listGameReviews, type ReviewSort } from '@/api/games'
import AppWindow from '@/components/AppWindow.vue'
import ErrorMessage from '@/components/ErrorMessage.vue'
import LibraryActions from '@/components/LibraryActions.vue'
import PageNav from '@/components/PageNav.vue'
import RatingHistogram from '@/components/RatingHistogram.vue'
import ReviewCard from '@/components/ReviewCard.vue'
import StarRating from '@/components/StarRating.vue'
import { formatDate, formatNumber } from '@/lib/format'
import { kindLabel } from '@/lib/labels'
import { useLikedReviews } from '@/lib/likes'

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

/** As avaliações paginam e ordenam pela URL: {@code ?page=2&sort=likes}. */
const route = useRoute()
const router = useRouter()
const reviewPage = computed(() => Math.max(1, Number(route.query.page) || 1))
const reviewSort = computed<ReviewSort>({
  get: () => (route.query.sort === 'likes' ? 'likes' : 'recent'),
  set: (sort) =>
    router.replace({
      query: { ...route.query, sort: sort === 'recent' ? undefined : sort, page: undefined },
    }),
})
const {
  data: reviews,
  error: reviewsError,
  refetch: refetchReviews,
} = useQuery({
  queryKey: ['game-reviews', slug, reviewSort, reviewPage],
  queryFn: () => listGameReviews(slug.value, reviewPage.value - 1, reviewSort.value),
  placeholderData: keepPreviousData,
})
const liked = useLikedReviews(computed(() => reviews.value?.content))

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

      <LibraryActions :game="game" />

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

      <fieldset class="community">
        <legend>Comunidade</legend>
        <div v-if="game.community.averageRating !== null" class="average">
          <StarRating
            :model-value="game.community.averageRating"
            readonly
            label="Média da comunidade"
          />
          <span class="prose">
            {{ formatNumber(game.community.ratingsCount) }}
            {{ game.community.ratingsCount === 1 ? 'nota' : 'notas' }}
          </span>
          <RatingHistogram :distribution="game.community.ratingDistribution" />
        </div>
        <p v-else class="prose">Ninguém deu nota ainda.</p>
        <dl class="numbers">
          <div>
            <dt>Recomendam</dt>
            <dd>
              {{
                game.community.recommendPercent === null
                  ? '—'
                  : `${game.community.recommendPercent}%`
              }}
            </dd>
          </div>
          <div>
            <dt>Jogaram</dt>
            <dd>{{ formatNumber(game.community.playersCount) }}</dd>
          </div>
          <div>
            <dt>Querem jogar</dt>
            <dd>{{ formatNumber(game.community.wantToPlayCount) }}</dd>
          </div>
        </dl>
      </fieldset>

      <fieldset>
        <legend>Avaliações</legend>
        <label v-if="reviews && reviews.page.totalElements > 1" class="sort">
          Ordenar por
          <select v-model="reviewSort">
            <option value="recent">Mais recentes</option>
            <option value="likes">Mais curtidas</option>
          </select>
        </label>
        <ErrorMessage v-if="reviewsError" @retry="refetchReviews()">
          Não foi possível carregar as avaliações.
        </ErrorMessage>
        <p v-else-if="reviews && !reviews.content.length" class="prose">
          Ainda não há avaliações públicas deste jogo.
        </p>
        <ul v-else-if="reviews" class="reviews">
          <li v-for="review in reviews.content" :key="review.id">
            <ReviewCard :review="review" :liked="liked.has(review.id)" />
          </li>
        </ul>
        <PageNav
          v-if="reviews && reviews.page.totalPages > 1"
          :page="reviewPage"
          :total-pages="reviews.page.totalPages"
        />
      </fieldset>
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

.average {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 8px 12px;
}

.average .histogram {
  grid-column: 1 / -1;
  max-width: 320px;
}

.numbers {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  margin: 0;
}

.numbers dt {
  font-size: 13px;
}

.numbers dd {
  margin: 0;
  font: 20px var(--font-display);
}

.sort {
  display: flex;
  align-items: center;
  justify-self: end;
  gap: 8px;
  font-size: 14px;
}

.reviews {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
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
