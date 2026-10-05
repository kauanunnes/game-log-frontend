<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useQueryClient } from '@tanstack/vue-query'
import { likeReview, unlikeReview } from '@/api/games'
import { useSubmit } from '@/lib/useSubmit'
import { useAuthStore } from '@/stores/auth'
import type { PublicReview } from '@/types/api'

const props = defineProps<{ review: PublicReview; liked: boolean }>()

const auth = useAuthStore()
const route = useRoute()
const queryClient = useQueryClient()

/** Muda na hora do clique e volta a seguir as props quando a lista recarrega. */
const on = ref(props.liked)
const count = ref(props.review.likes)
watch(
  () => [props.liked, props.review.likes] as const,
  ([liked, likes]) => {
    on.value = liked
    count.value = likes
  },
)

const own = computed(() => auth.user?.username === props.review.user.username)
const label = computed(() => `${count.value} ${count.value === 1 ? 'curtida' : 'curtidas'}`)

const {
  busy,
  error,
  submit: toggle,
} = useSubmit(async () => {
  const next = !on.value
  await (next ? likeReview(props.review.id) : unlikeReview(props.review.id))
  on.value = next
  count.value += next ? 1 : -1
  // As listas só ficam marcadas como velhas: na ordem por curtidas, nada pula na frente de quem está lendo.
  for (const queryKey of [
    ['game-reviews'],
    ['reviews'],
    ['profile'],
    ['me', auth.user?.id, 'likes'],
  ]) {
    void queryClient.invalidateQueries({ queryKey, refetchType: 'none' })
  }
})
</script>

<template>
  <span class="like">
    <RouterLink
      v-if="!auth.user"
      class="button heart"
      :to="{ name: 'login', query: { redirect: route.fullPath } }"
      title="Entre para curtir"
    >
      <span aria-hidden="true">♥</span> {{ label }}
    </RouterLink>
    <span v-else-if="own" class="prose count"><span aria-hidden="true">♥</span> {{ label }}</span>
    <button
      v-else
      type="button"
      class="heart"
      :aria-pressed="on"
      :disabled="busy"
      :title="on ? 'Descurtir' : 'Curtir'"
      @click="toggle"
    >
      <span aria-hidden="true">♥</span> {{ label }}
    </button>
    <small v-if="error" class="error" role="alert">{{ error }}</small>
  </span>
</template>

<style scoped>
.like {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.heart {
  padding: 2px 8px;
  font: 12px var(--font-text);
}

.count {
  color: var(--muted);
  font-size: 12px;
}

/* Botão de alternar do Win95: afundado e rosa enquanto está curtido. */
button[aria-pressed='true'] {
  box-shadow: var(--pressed);
  color: var(--accent-pink);
}

.error {
  font-size: 12px;
}
</style>
