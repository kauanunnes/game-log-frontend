<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import ErrorMessage from '@/components/ErrorMessage.vue'
import PageNav from '@/components/PageNav.vue'
import ReviewCard from '@/components/ReviewCard.vue'
import { useProfileSource } from '@/lib/profileSource'
import type { PublicReview } from '@/types/api'

const route = useRoute()
const username = computed(() => String(route.params.username))
const source = useProfileSource(username)
const page = computed(() => Math.max(1, Number(route.query.page) || 1))

const { data, error, refetch } = useQuery({
  queryKey: ['profile', username, source.isOwner, 'reviews', page],
  queryFn: () => source.library({ reviewed: true, page: page.value - 1, size: 10 }),
  placeholderData: keepPreviousData,
})

/** A aba usa o mesmo cartão das avaliações públicas, mostrando o jogo em vez do autor. */
const reviews = computed<PublicReview[]>(() =>
  (data.value?.content ?? []).map((entry) => ({
    user: { username: username.value, displayName: null },
    game: entry.game,
    status: entry.status,
    rating: entry.review?.rating ?? null,
    recommends: entry.review?.recommends ?? null,
    text: entry.review?.text ?? '',
    hasSpoilers: entry.review?.hasSpoilers ?? false,
    reviewedAt: entry.updatedAt,
  })),
)
</script>

<template>
  <ErrorMessage v-if="error" @retry="refetch()">
    Não foi possível carregar as avaliações. {{ error.message }}
  </ErrorMessage>
  <p v-else-if="data && !reviews.length" class="prose empty">Nenhuma avaliação escrita ainda.</p>
  <ul v-else class="reviews">
    <li v-for="review in reviews" :key="review.game.id">
      <ReviewCard :review="review" show-game />
    </li>
  </ul>
  <PageNav
    v-if="data && data.page.totalPages > 1"
    class="pages"
    :page="page"
    :total-pages="data.page.totalPages"
  />
</template>

<style scoped>
.reviews {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.empty {
  padding: 32px 0;
  text-align: center;
}

.pages {
  margin-top: 12px;
}
</style>
