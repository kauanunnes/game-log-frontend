<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/vue-query'
import { createList } from '@/api/me'
import ErrorMessage from '@/components/ErrorMessage.vue'
import ListCard from '@/components/ListCard.vue'
import PageNav from '@/components/PageNav.vue'
import { useProfileSource } from '@/lib/profileSource'
import { useSubmit } from '@/lib/useSubmit'

const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()
const username = computed(() => String(route.params.username))
const source = useProfileSource(username)
const page = computed(() => Math.max(1, Number(route.query.page) || 1))

const { data, error, refetch } = useQuery({
  queryKey: ['profile', username, source.isOwner, 'lists', page],
  queryFn: () => source.lists(page.value - 1),
  placeholderData: keepPreviousData,
})

const empty = computed(() =>
  source.isOwner.value
    ? 'Você ainda não tem listas. Que tal um "Top 10"?'
    : `@${username.value} ainda não tem listas públicas.`,
)

/** A dona cria a lista só com o título e já cai no editor dela. */
const title = ref('')
const {
  busy,
  error: createError,
  submit: create,
} = useSubmit(async () => {
  const list = await createList({ title: title.value, description: null, visibility: 'PUBLIC' })
  void queryClient.invalidateQueries({ queryKey: ['profile'] })
  await router.push({
    name: 'list',
    params: { username: username.value, listId: list.id },
    query: { editar: '1' },
  })
})
</script>

<template>
  <div class="lists">
    <form v-if="source.isOwner.value" class="new" @submit.prevent="create">
      <input
        v-model="title"
        maxlength="80"
        placeholder="Título da nova lista"
        aria-label="Título da nova lista"
        required
      />
      <button type="submit" :disabled="busy">Nova lista</button>
      <p v-if="createError" class="error" role="alert">{{ createError }}</p>
    </form>

    <ErrorMessage v-if="error" @retry="refetch()">
      Não foi possível carregar as listas. {{ error.message }}
    </ErrorMessage>
    <p v-else-if="data && !data.content.length" class="prose empty">{{ empty }}</p>
    <ul v-else-if="data" class="grid">
      <li v-for="list in data.content" :key="list.id">
        <ListCard :list="list" :username="username" />
      </li>
    </ul>
    <PageNav
      v-if="data && data.page.totalPages > 1"
      :page="page"
      :total-pages="data.page.totalPages"
    />
  </div>
</template>

<style scoped>
.lists {
  display: grid;
  gap: 12px;
}

.new {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.new input {
  flex: 1;
  min-width: 0;
}

.new .error {
  flex-basis: 100%;
}

.empty {
  margin: 0;
  padding: 32px 0;
  text-align: center;
}
</style>
