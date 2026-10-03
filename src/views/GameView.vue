<script setup lang="ts">
import AppWindow from '@/components/AppWindow.vue'
import UnderConstruction from '@/components/UnderConstruction.vue'

defineProps<{ slug: string }>()
</script>

<template>
  <AppWindow :title="`${slug}.exe`">
    <UnderConstruction
      :items="[
        'Capa e dados do jogo',
        'Números da comunidade',
        'Avaliações',
        'Adicionar à biblioteca',
      ]"
    />
  </AppWindow>
</template>
