<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { getMyEntry } from '@/api/me'
import { statusLabel } from '@/lib/labels'
import { useAuthStore } from '@/stores/auth'
import LibraryEntryDialog from './LibraryEntryDialog.vue'
import StarRating from './StarRating.vue'

const props = defineProps<{ game: { id: number; slug: string; title: string } }>()

const auth = useAuthStore()
const route = useRoute()
const userId = computed(() => auth.user?.id)
const gameId = computed(() => props.game.id)

const { data: entry } = useQuery({
  queryKey: ['me', userId, 'entry', gameId],
  queryFn: () => getMyEntry(gameId.value),
  enabled: computed(() => auth.isLoggedIn),
})

const open = ref(false)
</script>

<template>
  <fieldset class="library">
    <legend>Sua biblioteca</legend>
    <template v-if="!auth.isLoggedIn">
      <p class="prose">Entre para registrar este jogo, dar nota e contar o que achou.</p>
      <RouterLink class="button" :to="{ name: 'login', query: { redirect: route.fullPath } }">
        Entrar
      </RouterLink>
    </template>
    <template v-else-if="entry">
      <p class="prose status">
        <mark>{{ statusLabel[entry.status] }}</mark>
        <span v-if="entry.favorite" title="Favorito">♥</span>
        <StarRating
          v-if="entry.review?.rating != null"
          :model-value="entry.review.rating"
          readonly
          label="Sua nota"
        />
      </p>
      <button type="button" @click="open = true">Editar</button>
    </template>
    <template v-else-if="entry === null">
      <p class="prose">Este jogo ainda não está na sua biblioteca.</p>
      <button type="button" @click="open = true">Adicionar à biblioteca</button>
    </template>
  </fieldset>

  <LibraryEntryDialog
    v-if="auth.isLoggedIn"
    :open="open"
    :game="game"
    :entry="entry ?? null"
    @close="open = false"
  />
</template>

<style scoped>
.library {
  grid-template-columns: 1fr auto;
  align-items: center;
  margin-bottom: 16px;
}

.library p {
  margin: 0;
}

.status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.status span {
  color: var(--pink-deep);
}
</style>
