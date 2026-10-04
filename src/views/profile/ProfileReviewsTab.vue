<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import ErrorMessage from '@/components/ErrorMessage.vue'
import PageNav from '@/components/PageNav.vue'
import ReviewCard from '@/components/ReviewCard.vue'
import { useLikedReviews } from '@/lib/likes'
import { useProfileSource } from '@/lib/profileSource'

const route = useRoute()
const username = computed(() => String(route.params.username))
const source = useProfileSource(username)
const page = computed(() => Math.max(1, Number(route.query.page) || 1))

const { data, error, refetch } = useQuery({
  queryKey: ['profile', username, source.isOwner, 'reviews', page],
  queryFn: () => source.reviews(page.value - 1),
  placeholderData: keepPreviousData,
})

const reviews = computed(() => data.value?.content ?? [])
const liked = useLikedReviews(reviews)
</script>

<template>
  <ErrorMessage v-if="error" @retry="refetch()">
    Não foi possível carregar as avaliações. {{ error.message }}
  </ErrorMessage>
  <p v-else-if="data && !reviews.length" class="prose empty">Nenhuma avaliação escrita ainda.</p>
  <ul v-else class="reviews">
    <li v-for="review in reviews" :key="review.id">
      <ReviewCard :review="review" :liked="liked.has(review.id)" show-game />
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
