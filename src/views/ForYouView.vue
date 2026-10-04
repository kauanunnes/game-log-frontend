<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { getMyRecommendations } from '@/api/me'
import AppWindow from '@/components/AppWindow.vue'
import ErrorMessage from '@/components/ErrorMessage.vue'
import GameCardSkeleton from '@/components/GameCardSkeleton.vue'
import SuggestionList from '@/components/SuggestionList.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

/** A biblioteca mexida invalida tudo em ['me'], e as sugestões são recalculadas. */
const { data, error, refetch } = useQuery({
  queryKey: ['me', computed(() => auth.user?.id), 'recommendations'],
  queryFn: getMyRecommendations,
})
</script>

<template>
  <AppWindow title="Para você.exe">
    <div class="stack">
      <ErrorMessage v-if="error" @retry="refetch()">
        Não foi possível carregar as sugestões. {{ error.message }}
      </ErrorMessage>
      <ul v-else-if="!data" class="grid">
        <li v-for="n in 8" :key="n"><GameCardSkeleton /></li>
      </ul>
      <template v-else>
        <p v-if="data.personalized" class="prose">
          Jogos parecidos com os que você favoritou, avaliou bem ou quer jogar, fora os que já estão
          na sua biblioteca.
        </p>
        <p v-else class="prose">
          Ainda não sabemos do que você gosta. Favorite ou avalie alguns jogos e as sugestões passam
          a seguir o seu gosto; por enquanto, aqui estão os mais populares.
        </p>
        <SuggestionList :suggestions="data.suggestions" />
      </template>
    </div>
    <template #status>
      <span>Sugestões por semelhança, sem IA generativa</span>
    </template>
  </AppWindow>
</template>

<style scoped>
.stack {
  display: grid;
  gap: 12px;
}

p {
  margin: 0;
}
</style>
