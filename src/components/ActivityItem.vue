<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatRelative } from '@/lib/format'
import type { Activity, EntryStatus } from '@/types/api'
import GameRow from './GameRow.vue'
import StarRating from './StarRating.vue'

const props = defineProps<{ activity: Activity }>()

/** O verbo e, quando precisa, o que vem depois do jogo: "adicionou Hades à lista de desejos". */
const STATUS_PHRASE: Record<EntryStatus, [string, string?]> = {
  WISHLIST: ['adicionou', 'à lista de desejos'],
  BACKLOG: ['quer jogar'],
  PLAYING: ['começou a jogar'],
  PLAYED: ['jogou'],
  DROPPED: ['abandonou'],
}

const phrase = computed((): [string, string?] => {
  const { type, status, completed } = props.activity
  if (type === 'REVIEW') return ['avaliou']
  if (type === 'FAVORITE') return ['favoritou']
  return completed ? ['zerou'] : STATUS_PHRASE[status]
})

const revealed = ref(false)
</script>

<template>
  <GameRow :game="activity.game">
    <p class="prose what">
      <RouterLink :to="{ name: 'profile', params: { username: activity.user.username } }">
        {{ activity.user.displayName ?? activity.user.username }}
      </RouterLink>
      {{ phrase[0] }}
      <RouterLink :to="{ name: 'game', params: { slug: activity.game.slug } }">
        {{ activity.game.title }}
      </RouterLink>
      {{ phrase[1] }}
      <time class="when" :datetime="activity.createdAt">
        · {{ formatRelative(activity.createdAt) }}
      </time>
    </p>
    <div v-if="activity.review" class="review">
      <div
        v-if="activity.review.rating !== null || activity.review.recommends !== null"
        class="meta"
      >
        <StarRating
          v-if="activity.review.rating !== null"
          :model-value="activity.review.rating"
          readonly
          label="Nota"
          class="stars"
        />
        <mark
          v-if="activity.review.recommends !== null"
          :class="{ no: !activity.review.recommends }"
        >
          {{ activity.review.recommends ? 'Recomenda' : 'Não recomenda' }}
        </mark>
      </div>
      <template v-if="activity.review.text">
        <button
          v-if="activity.review.hasSpoilers && !revealed"
          type="button"
          class="spoiler"
          @click="revealed = true"
        >
          Contém spoiler. Clique para ler.
        </button>
        <p v-else class="prose text">{{ activity.review.text }}</p>
      </template>
    </div>
  </GameRow>
</template>

<style scoped>
.what {
  margin: 0;
}

.what a {
  font-weight: 700;
}

.when {
  color: var(--muted);
  font-size: 12px;
  white-space: nowrap;
}

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

.stars {
  font-size: 13px;
}

mark {
  font: 12px var(--font-text);
}

mark.no {
  background: var(--neutral);
}

.text {
  margin: 0;
  white-space: pre-line;
  overflow-wrap: anywhere;
}
</style>
