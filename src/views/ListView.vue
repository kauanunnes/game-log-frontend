<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { ApiError } from '@/api/client'
import AppWindow from '@/components/AppWindow.vue'
import ErrorMessage from '@/components/ErrorMessage.vue'
import GameRow from '@/components/GameRow.vue'
import ListEditor from '@/components/ListEditor.vue'
import { useProfileSource } from '@/lib/profileSource'
import type { GameList } from '@/types/api'

const props = defineProps<{ username: string; listId: number }>()
const username = toRef(props, 'username')
const source = useProfileSource(username)
const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()

const key = computed(() => ['profile', username.value, source.isOwner.value, 'list', props.listId])
const {
  data: list,
  error,
  refetch,
} = useQuery({
  queryKey: key,
  queryFn: () => source.list(props.listId),
})

const status = computed(() => (error.value instanceof ApiError ? error.value.problem.status : null))

/** A dona edita no lugar; vindo de "Nova lista", o editor já abre. */
const editing = ref(route.query.editar === '1')

/** Fecha o editor e tira o {@code ?editar=1}, para um reload não reabrir. */
function close() {
  editing.value = false
  if (route.query.editar) void router.replace({ query: {} })
}

function saved(updated: GameList) {
  queryClient.setQueryData(key.value, updated)
  void queryClient.invalidateQueries({ queryKey: ['profile'], refetchType: 'none' })
  close()
}

async function deleted() {
  queryClient.removeQueries({ queryKey: key.value })
  void queryClient.invalidateQueries({ queryKey: ['profile'] })
  await router.push({ name: 'profile-lists', params: { username: username.value } })
}
</script>

<template>
  <AppWindow :title="`${list?.title ?? 'Lista'}.exe`">
    <div v-if="status === 404" class="not-found">
      <span class="error-icon" aria-hidden="true">×</span>
      <p class="prose">Lista não encontrada. Ela pode ter sido excluída ou ser privada.</p>
    </div>
    <p v-else-if="status === 403" class="prose locked">Este perfil é privado.</p>
    <ErrorMessage v-else-if="error" @retry="refetch()">
      Não foi possível carregar a lista. {{ error.message }}
    </ErrorMessage>

    <template v-else-if="list">
      <ListEditor
        v-if="editing && source.isOwner.value"
        :list="list"
        @saved="saved"
        @cancel="close"
        @deleted="deleted"
      />
      <template v-else>
        <header class="header">
          <h2>{{ list.title }}</h2>
          <p class="prose by">
            por
            <RouterLink :to="{ name: 'profile', params: { username } }">
              {{ list.owner.displayName ?? list.owner.username }}
            </RouterLink>
            · {{ list.items.length }} {{ list.items.length === 1 ? 'jogo' : 'jogos' }}
            <template v-if="list.visibility === 'PRIVATE'"> · privada</template>
          </p>
          <p v-if="list.description" class="prose description">{{ list.description }}</p>
          <div v-if="source.isOwner.value" class="actions">
            <button type="button" @click="editing = true">Editar lista</button>
          </div>
        </header>

        <p v-if="!list.items.length" class="prose empty">Nenhum jogo nesta lista ainda.</p>
        <ol v-else class="items">
          <li v-for="item in list.items" :key="item.game.id">
            <span class="position" aria-hidden="true">{{ item.position }}</span>
            <GameRow :game="item.game">
              <RouterLink class="title" :to="{ name: 'game', params: { slug: item.game.slug } }">
                {{ item.game.title }}
              </RouterLink>
              <small v-if="item.game.releaseYear" class="hint">{{ item.game.releaseYear }}</small>
              <p v-if="item.note" class="prose note">{{ item.note }}</p>
            </GameRow>
          </li>
        </ol>
      </template>
    </template>
  </AppWindow>
</template>

<style scoped>
.header {
  display: grid;
  gap: 6px;
  margin-bottom: 16px;
}

h2 {
  font-size: 22px;
}

.header p {
  margin: 0;
}

.by {
  color: var(--muted);
  font-size: 14px;
}

.description {
  max-width: 60ch;
  white-space: pre-line;
}

.actions {
  justify-content: flex-start;
}

.items {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.items > li {
  display: grid;
  grid-template-columns: 3ch minmax(0, 1fr);
  align-items: start;
  gap: 8px;
}

.position {
  padding-top: 4px;
  font: 16px var(--font-display);
  text-align: right;
}

.title {
  font-weight: 700;
}

.note {
  margin: 0;
  white-space: pre-line;
}

.empty {
  margin: 0;
  padding: 32px 0;
  text-align: center;
}

.locked {
  padding: 10px 12px;
  background: var(--field);
  box-shadow: var(--sunken);
  text-align: center;
}

.not-found {
  display: flex;
  align-items: center;
  gap: 16px;
}
</style>
