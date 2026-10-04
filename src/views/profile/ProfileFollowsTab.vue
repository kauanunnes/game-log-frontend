<script setup lang="ts">
import { computed, toRef } from 'vue'
import { useRoute } from 'vue-router'
import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import type { FollowList } from '@/api/users'
import ErrorMessage from '@/components/ErrorMessage.vue'
import PageNav from '@/components/PageNav.vue'
import { formatDate } from '@/lib/format'
import { useProfileSource } from '@/lib/profileSource'

const props = defineProps<{ list: FollowList }>()
const list = toRef(props, 'list')

const route = useRoute()
const username = computed(() => String(route.params.username))
const source = useProfileSource(username)
const page = computed(() => Math.max(1, Number(route.query.page) || 1))

const { data, error, refetch } = useQuery({
  queryKey: ['profile', username, source.isOwner, list, page],
  queryFn: () => source.follows(list.value, page.value - 1),
  placeholderData: keepPreviousData,
})

const empty = computed(() => {
  const who = source.isOwner.value ? null : `@${username.value}`
  if (list.value === 'followers') {
    return who ? `Ninguém segue ${who} ainda.` : 'Ninguém segue você ainda.'
  }
  return who ? `${who} ainda não segue ninguém.` : 'Você ainda não segue ninguém.'
})
</script>

<template>
  <section class="follow-list">
    <h3>{{ list === 'followers' ? 'Seguidores' : 'Seguindo' }}</h3>
    <ErrorMessage v-if="error" @retry="refetch()">
      Não foi possível carregar a lista. {{ error.message }}
    </ErrorMessage>
    <p v-else-if="data && !data.content.length" class="prose empty">{{ empty }}</p>
    <ul v-else-if="data" class="people">
      <li v-for="person in data.content" :key="person.username">
        <RouterLink :to="{ name: 'profile', params: { username: person.username } }">
          {{ person.displayName ?? person.username }}
        </RouterLink>
        <span class="prose handle">@{{ person.username }}</span>
        <small class="hint since">desde {{ formatDate(person.followedAt.slice(0, 10)) }}</small>
      </li>
    </ul>
    <PageNav
      v-if="data && data.page.totalPages > 1"
      :page="page"
      :total-pages="data.page.totalPages"
    />
  </section>
</template>

<style scoped>
.follow-list {
  display: grid;
  gap: 12px;
}

h3 {
  margin: 0;
}

.people {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.people li {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 10px;
  padding: 8px 10px;
  background: var(--field);
  box-shadow: var(--sunken);
}

.people a {
  font-weight: 700;
  overflow-wrap: anywhere;
}

.handle {
  color: var(--muted);
  font-size: 14px;
}

.since {
  margin-left: auto;
}

.empty {
  margin: 0;
  padding: 24px 0;
  text-align: center;
}
</style>
