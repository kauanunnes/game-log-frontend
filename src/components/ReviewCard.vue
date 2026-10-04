<script setup lang="ts">
import { ref } from 'vue'
import { formatDate } from '@/lib/format'
import { statusLabel } from '@/lib/labels'
import type { PublicReview } from '@/types/api'
import LikeButton from './LikeButton.vue'
import ReportButton from './ReportButton.vue'
import StarRating from './StarRating.vue'

/**
 * @param showGame mostra o jogo em vez do autor (lista de uma pessoa só)
 * @param liked se eu curti; vem da página, que pergunta por todas as avaliações dela de uma vez
 * @param actions curtir e denunciar; a moderação desliga
 */
const { actions = true } = defineProps<{
  review: PublicReview
  showGame?: boolean
  liked?: boolean
  actions?: boolean
}>()

const revealed = ref(false)
</script>

<template>
  <article class="review">
    <header class="meta">
      <RouterLink v-if="showGame" :to="{ name: 'game', params: { slug: review.game.slug } }">
        {{ review.game.title }}
      </RouterLink>
      <RouterLink v-else :to="{ name: 'profile', params: { username: review.user.username } }">
        {{ review.user.displayName ?? review.user.username }}
      </RouterLink>
      <StarRating
        v-if="review.rating !== null"
        :model-value="review.rating"
        readonly
        label="Nota"
        class="stars"
      />
      <mark v-if="review.recommends !== null" :class="{ no: !review.recommends }">
        {{ review.recommends ? 'Recomenda' : 'Não recomenda' }}
      </mark>
    </header>

    <button
      v-if="review.hasSpoilers && !revealed"
      type="button"
      class="spoiler"
      @click="revealed = true"
    >
      Contém spoiler. Clique para ler.
    </button>
    <p v-else class="prose text">{{ review.text }}</p>

    <footer class="footer">
      <span class="prose when">
        {{ statusLabel[review.status] }} · {{ formatDate(review.reviewedAt.slice(0, 10)) }}
      </span>
      <span v-if="actions" class="actions">
        <LikeButton :review="review" :liked="liked ?? false" />
        <ReportButton :review="review" />
      </span>
    </footer>
  </article>
</template>

<style scoped>
.review {
  display: grid;
  gap: 8px;
  padding: 10px 12px;
  background: var(--field);
  box-shadow: var(--sunken);
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 12px;
}

.meta a {
  font-weight: 700;
}

.stars {
  font-size: 13px;
}

mark {
  font: 12px var(--font-text);
}

mark.no {
  background: var(--light);
}

.text {
  margin: 0;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.when {
  color: var(--muted);
  font-size: 12px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
</style>
