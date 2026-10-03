<script setup lang="ts">
import AppWindow from '@/components/AppWindow.vue'
import UnderConstruction from '@/components/UnderConstruction.vue'
</script>

<template>
  <AppWindow title="Explorar.exe">
    <UnderConstruction
      :items="['Busca no catálogo do IGDB', 'Filtros por gênero, plataforma e ano', 'Ordenação']"
    />
  </AppWindow>
</template>
