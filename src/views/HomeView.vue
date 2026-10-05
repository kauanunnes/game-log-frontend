<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { listRecentReviews, searchGames } from '@/api/games'
import AppWindow from '@/components/AppWindow.vue'
import ErrorMessage from '@/components/ErrorMessage.vue'
import GameCard from '@/components/GameCard.vue'
import GameCardSkeleton from '@/components/GameCardSkeleton.vue'
import GameRow from '@/components/GameRow.vue'
import PixelStar from '@/components/PixelStar.vue'
import ReviewCard from '@/components/ReviewCard.vue'
import SuggestionList from '@/components/SuggestionList.vue'
import { useLikedReviews } from '@/lib/likes'
import { useRecommendations } from '@/lib/recommendations'
import { useAuthStore } from '@/stores/auth'

const TRENDING = 12
const REVIEWS = 5
const SUGGESTIONS = 6

const auth = useAuthStore()

/** Recado de quem mandou para cá, como a exclusão da conta. */
const notice: string | undefined = history.state?.notice

const {
  data: trending,
  error: trendingError,
  refetch: refetchTrending,
} = useQuery({
  queryKey: ['games', 'trending'],
  queryFn: () => searchGames({ sort: 'trending', size: TRENDING }),
})
const {
  data: reviews,
  error: reviewsError,
  refetch: refetchReviews,
} = useQuery({
  queryKey: ['reviews', 'recent'],
  queryFn: () => listRecentReviews(REVIEWS),
})
const liked = useLikedReviews(computed(() => reviews.value?.content))

/** Com sessão, as primeiras sugestões de "Para você", na mesma consulta da tela inteira. */
const { data: recommendations } = useRecommendations(computed(() => !!auth.user))
const suggestions = computed(() => recommendations.value?.suggestions.slice(0, SUGGESTIONS) ?? [])
</script>

<template>
  <AppWindow title="GameLog.exe" tone="pink">
    <p v-if="notice" class="prose notice" role="status">{{ notice }}</p>
    <div class="hero">
      <PixelStar class="star" />
      <h2 class="logo">Game<br />Log</h2>
      <p class="prose pitch">
        Registre o que você jogou, o que achou e quanto pagou. Monte sua
        <mark>lista de desejos</mark> e mostre tudo no seu perfil.
      </p>
      <div class="actions">
        <RouterLink class="button" :to="{ name: 'explore' }">Explorar jogos</RouterLink>
        <RouterLink
          v-if="auth.user"
          class="button"
          :to="{ name: 'profile-playing', params: { username: auth.user.username } }"
        >
          Jogando agora
        </RouterLink>
        <RouterLink v-else class="button" :to="{ name: 'signup' }">Criar conta</RouterLink>
      </div>
    </div>
    <template #status>
      <span>Pronto</span>
      <span>v0.1</span>
    </template>
  </AppWindow>

  <AppWindow v-if="auth.user && suggestions.length" title="Você poderá gostar.exe">
    <div class="stack">
      <SuggestionList :suggestions="suggestions" />
      <RouterLink class="more" :to="{ name: 'for-you' }">Ver todas em Para você</RouterLink>
    </div>
  </AppWindow>

  <AppWindow title="Em alta.exe">
    <div class="stack">
      <p class="prose">Os jogos mais adicionados nos últimos 7 dias.</p>
      <ErrorMessage v-if="trendingError" @retry="refetchTrending()">
        Não foi possível carregar os jogos. {{ trendingError.message }}
      </ErrorMessage>
      <ul v-else-if="!trending" class="grid">
        <li v-for="n in TRENDING" :key="n"><GameCardSkeleton /></li>
      </ul>
      <ul v-else class="grid">
        <li v-for="game in trending.content" :key="game.id"><GameCard :game="game" /></li>
      </ul>
      <RouterLink class="more" :to="{ name: 'explore', query: { sort: 'trending' } }">
        Ver mais em Explorar
      </RouterLink>
    </div>
  </AppWindow>

  <AppWindow title="Avaliações.exe">
    <div class="stack">
      <p class="prose">O que a comunidade escreveu por último.</p>
      <ErrorMessage v-if="reviewsError" @retry="refetchReviews()">
        Não foi possível carregar as avaliações. {{ reviewsError.message }}
      </ErrorMessage>
      <ul v-else-if="!reviews" class="feed" aria-hidden="true">
        <li v-for="n in 3" :key="n" class="loading placeholder" />
      </ul>
      <p v-else-if="!reviews.content.length" class="prose">
        Ninguém avaliou um jogo ainda.
        <RouterLink :to="{ name: 'explore' }">Que tal escrever a primeira?</RouterLink>
      </p>
      <ul v-else class="feed">
        <li v-for="review in reviews.content" :key="review.id">
          <GameRow :game="review.game">
            <RouterLink class="title" :to="{ name: 'game', params: { slug: review.game.slug } }">
              {{ review.game.title }}
            </RouterLink>
            <ReviewCard :review="review" :liked="liked.has(review.id)" />
          </GameRow>
        </li>
      </ul>
    </div>
  </AppWindow>
</template>

<style scoped>
.hero {
  display: grid;
  justify-items: center;
  gap: 16px;
  padding: 32px 16px;
  background: var(--pastel);
  box-shadow: var(--sunken);
  text-align: center;
}

.star {
  width: 56px;
  color: var(--star);
  filter: drop-shadow(3px 3px 0 var(--black));
}

.logo {
  color: var(--white);
  font: clamp(24px, 7vw, 44px) / 1.3 var(--font-display);
  text-shadow:
    3px 3px var(--pink-deep),
    6px 6px var(--black);
  text-transform: uppercase;
}

.pitch {
  max-width: 52ch;
  margin: 0;
}

.actions {
  justify-content: center;
}

.notice {
  margin: 0 0 12px;
  padding: 10px 12px;
  background: var(--notice);
  box-shadow: var(--sunken);
}

.stack {
  display: grid;
  gap: 12px;
}

.stack > p {
  margin: 0;
}

.more {
  justify-self: end;
  font-size: 14px;
}

.feed {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.title {
  font-weight: 700;
}

.placeholder {
  height: 96px;
}
</style>
