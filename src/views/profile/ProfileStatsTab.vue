<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import BarList from '@/components/BarList.vue'
import ErrorMessage from '@/components/ErrorMessage.vue'
import RatingHistogram from '@/components/RatingHistogram.vue'
import StarRating from '@/components/StarRating.vue'
import { formatMoney, formatNumber } from '@/lib/format'
import { statusLabel } from '@/lib/labels'
import { useProfileSource } from '@/lib/profileSource'
import type { EntryStatus, NamedCount } from '@/types/api'

const route = useRoute()
const username = computed(() => String(route.params.username))
const source = useProfileSource(username)

const {
  data: stats,
  error,
  refetch,
} = useQuery({
  queryKey: ['profile', username, source.isOwner, 'stats'],
  queryFn: source.stats,
})

const named = (items: NamedCount[]) =>
  items.map(({ name, count }) => ({ label: name, value: count }))
const byStatus = computed(() =>
  Object.entries(stats.value?.byStatus ?? {}).map(([status, count]) => ({
    label: statusLabel[status as EntryStatus],
    value: count,
  })),
)
const byYear = computed(() =>
  (stats.value?.finishedByYear ?? []).map(({ year, count }) => ({
    label: String(year),
    value: count,
  })),
)
</script>

<template>
  <ErrorMessage v-if="error" @retry="refetch()">
    Não foi possível carregar as estatísticas. {{ error.message }}
  </ErrorMessage>
  <div v-else-if="stats" class="stats">
    <dl class="summary">
      <div>
        <dt>Jogos</dt>
        <dd>{{ formatNumber(stats.total) }}</dd>
      </div>
      <div>
        <dt>Horas jogadas</dt>
        <dd>{{ formatNumber(stats.hoursPlayed) }}</dd>
      </div>
      <div>
        <dt>Nota média</dt>
        <dd>
          <StarRating
            v-if="stats.averageRating != null"
            :model-value="stats.averageRating"
            readonly
            label="Nota média"
          />
          <template v-else>—</template>
        </dd>
      </div>
    </dl>

    <fieldset>
      <legend>Por status</legend>
      <BarList :items="byStatus" />
    </fieldset>
    <fieldset v-if="byYear.length">
      <legend>Terminados por ano</legend>
      <BarList :items="byYear" />
    </fieldset>
    <fieldset v-if="stats.byGenre.length">
      <legend>Gêneros</legend>
      <BarList :items="named(stats.byGenre)" />
    </fieldset>
    <fieldset v-if="stats.byPlatform.length">
      <legend>Plataformas</legend>
      <BarList :items="named(stats.byPlatform)" />
    </fieldset>
    <fieldset>
      <legend>Notas</legend>
      <RatingHistogram :distribution="stats.ratingDistribution" />
    </fieldset>
    <fieldset v-if="stats.spending?.length">
      <legend>Gastos</legend>
      <section v-for="spending in stats.spending" :key="spending.currency" class="spending">
        <p class="prose">
          <strong>{{ formatMoney(spending.total, spending.currency) }}</strong>
          em {{ spending.purchases }} {{ spending.purchases === 1 ? 'compra' : 'compras' }}
        </p>
        <ul class="prose money">
          <li v-for="store in spending.byStore" :key="store.storeId ?? 'sem-loja'">
            {{ store.name ?? 'Sem loja' }}: {{ formatMoney(store.total, spending.currency) }}
          </li>
          <li v-for="year in spending.byYear" :key="year.year">
            {{ year.year }}: {{ formatMoney(year.total, spending.currency) }}
          </li>
        </ul>
      </section>
    </fieldset>
  </div>
</template>

<style scoped>
.stats {
  display: grid;
  gap: 12px;
}

.summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 32px;
  margin: 0;
}

.summary div {
  display: flex;
  flex-direction: column-reverse;
}

.summary dt {
  font-size: 13px;
}

.summary dd {
  margin: 0;
  font: 18px var(--font-display);
}

.spending p {
  margin: 0 0 4px;
}

.money {
  margin: 0;
  padding-left: 18px;
  font-size: 14px;
}
</style>
