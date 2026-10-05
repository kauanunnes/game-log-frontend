<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { getMyFeed } from '@/api/me'
import ActivityItem from '@/components/ActivityItem.vue'
import AppWindow from '@/components/AppWindow.vue'
import ErrorMessage from '@/components/ErrorMessage.vue'
import PageNav from '@/components/PageNav.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const page = computed(() => Math.max(1, Number(route.query.page) || 1))

const { data, error, refetch } = useQuery({
  queryKey: ['me', computed(() => auth.user?.id), 'feed', page],
  queryFn: () => getMyFeed(page.value - 1),
  placeholderData: keepPreviousData,
})
</script>

<template>
  <AppWindow title="Feed.exe">
    <ErrorMessage v-if="error" @retry="refetch()">
      Não foi possível carregar o feed. {{ error.message }}
    </ErrorMessage>
    <ul v-else-if="!data" class="activities" aria-hidden="true">
      <li v-for="n in 4" :key="n" class="loading placeholder" />
    </ul>
    <div v-else-if="!data.content.length" class="empty">
      <p class="prose">Nada por aqui ainda. Siga pessoas para ver o que elas jogam e avaliam.</p>
      <RouterLink class="button" :to="{ name: 'home' }">Ver avaliações recentes</RouterLink>
    </div>
    <ul v-else class="activities">
      <li v-for="activity in data.content" :key="activity.id">
        <ActivityItem :activity="activity" />
      </li>
    </ul>
    <PageNav
      v-if="data && data.page.totalPages > 1"
      class="pages"
      :page="page"
      :total-pages="data.page.totalPages"
    />
  </AppWindow>
</template>

<style scoped>
.activities {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Linha gravada do Win95 entre um item e outro. */
.activities > li + li {
  padding-top: 12px;
  box-shadow:
    inset 0 1px var(--bevel-shadow),
    inset 0 2px var(--bevel-highlight);
}

.placeholder {
  height: 72px;
}

.empty {
  display: grid;
  justify-items: center;
  gap: 16px;
  padding: 48px 16px;
  text-align: center;
}

.empty p {
  max-width: 48ch;
  margin: 0;
}

.pages {
  margin-top: 12px;
}
</style>
