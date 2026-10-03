<script setup lang="ts">
import { useRoute } from 'vue-router'
import UnderConstruction from '@/components/UnderConstruction.vue'

const route = useRoute()
</script>

<template>
  <UnderConstruction :items="route.meta.title ? [route.meta.title] : []" />
</template>
