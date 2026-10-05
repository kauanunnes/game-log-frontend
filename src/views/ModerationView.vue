<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/vue-query'
import { listOpenReports, resolveReport } from '@/api/admin'
import { errorMessage } from '@/api/client'
import AppWindow from '@/components/AppWindow.vue'
import ErrorMessage from '@/components/ErrorMessage.vue'
import GameRow from '@/components/GameRow.vue'
import PageNav from '@/components/PageNav.vue'
import ReviewCard from '@/components/ReviewCard.vue'
import { formatRelative } from '@/lib/format'
import { reportReasonLabel } from '@/lib/labels'
import type { ReportDecision, ReportedReview } from '@/types/api'

const route = useRoute()
const queryClient = useQueryClient()
const page = computed(() => Math.max(1, Number(route.query.page) || 1))

const { data, error, refetch } = useQuery({
  queryKey: ['admin', 'reports', page],
  queryFn: () => listOpenReports(page.value - 1),
  placeholderData: keepPreviousData,
})

const busy = ref(false)
const failure = ref<string | null>(null)

/** A decisão vale para todas as denúncias abertas da avaliação, então qualquer uma delas serve. */
async function resolve(item: ReportedReview, decision: ReportDecision) {
  const [first] = item.reports
  if (!first) return
  if (decision === 'REMOVE' && !window.confirm('Tirar o texto desta avaliação? A nota fica.'))
    return
  busy.value = true
  failure.value = null
  try {
    await resolveReport(first.id, decision)
    await queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] })
    // Sem o texto, a avaliação some das listas públicas.
    for (const queryKey of [['game-reviews'], ['reviews'], ['profile']]) {
      void queryClient.invalidateQueries({ queryKey })
    }
  } catch (e) {
    failure.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <AppWindow title="Moderação.exe">
    <p class="prose intro">
      Avaliações denunciadas, as mais denunciadas primeiro. A decisão vale para todas as denúncias
      de cada uma.
    </p>
    <p v-if="failure" class="error" role="alert">{{ failure }}</p>
    <ErrorMessage v-if="error" @retry="refetch()">
      Não foi possível carregar as denúncias. {{ error.message }}
    </ErrorMessage>
    <p v-else-if="data && !data.content.length" class="prose empty">Nenhuma denúncia aberta.</p>
    <ul v-else-if="data" class="items">
      <li v-for="item in data.content" :key="item.review.id">
        <GameRow :game="item.review.game">
          <RouterLink class="title" :to="{ name: 'game', params: { slug: item.review.game.slug } }">
            {{ item.review.game.title }}
          </RouterLink>
          <ReviewCard :review="item.review" :actions="false" />
          <ul class="reports">
            <li v-for="report in item.reports" :key="report.id" class="prose">
              <strong>{{ reportReasonLabel[report.reason] }}</strong>
              ·
              <RouterLink :to="{ name: 'profile', params: { username: report.reporter } }">
                @{{ report.reporter }}
              </RouterLink>
              · {{ formatRelative(report.createdAt) }}
              <q v-if="report.details" class="details">{{ report.details }}</q>
            </li>
          </ul>
          <div class="actions">
            <button type="button" :disabled="busy" @click="resolve(item, 'KEEP')">Manter</button>
            <button type="button" :disabled="busy" @click="resolve(item, 'REMOVE')">
              Remover texto
            </button>
          </div>
        </GameRow>
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
.intro {
  margin: 0 0 12px;
}

.items {
  display: grid;
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Linha gravada do Win95 entre uma avaliação e outra. */
.items > li + li {
  padding-top: 16px;
  box-shadow:
    inset 0 1px var(--bevel-shadow),
    inset 0 2px var(--bevel-highlight);
}

.title {
  font-weight: 700;
}

.reports {
  display: grid;
  gap: 4px;
  margin: 0;
  padding-left: 18px;
  font-size: 14px;
}

.details {
  display: block;
  color: var(--muted);
}

.empty {
  margin: 0;
  padding: 32px 0;
  text-align: center;
}

.pages {
  margin-top: 12px;
}
</style>
