<script setup lang="ts">
import AppWindow from '@/components/AppWindow.vue'
import ErrorMessage from '@/components/ErrorMessage.vue'
import GameCardSkeleton from '@/components/GameCardSkeleton.vue'
import SuggestionList from '@/components/SuggestionList.vue'
import { useRecommendations } from '@/lib/recommendations'

const { data, error, refetch } = useRecommendations()
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
        <p v-if="data.source === 'CLAUDE'" class="prose">
          Escolhidas e explicadas pelo Claude a partir do que você favoritou, avaliou e escreveu,
          entre os jogos parecidos que você ainda não tem.
        </p>
        <p v-else-if="data.personalized" class="prose">
          Jogos parecidos com os que você favoritou, avaliou bem ou quer jogar, fora os que já estão
          na sua biblioteca.
        </p>
        <p v-else class="prose">
          Ainda não sabemos do que você gosta. Favorite ou avalie alguns jogos e as sugestões passam
          a seguir o seu gosto; por enquanto, aqui estão os mais populares.
        </p>
        <p v-if="data.curating" class="prose curating" role="status">
          O Claude está escolhendo as melhores para você; a lista muda sozinha em alguns segundos.
        </p>
        <SuggestionList :suggestions="data.suggestions" />
      </template>
    </div>
    <template #status>
      <span v-if="data?.source === 'CLAUDE'">Escolhidas pelo Claude</span>
      <span v-else>Sugestões por semelhança</span>
    </template>
  </AppWindow>
</template>

<style scoped>
.stack {
  display: grid;
  gap: 12px;
}

.curating {
  padding: 6px 10px;
  background: var(--pastel);
  box-shadow: var(--sunken);
}

p {
  margin: 0;
}
</style>
