<script setup lang="ts">
import { computed } from 'vue'
import { formatNumber } from '@/lib/format'

const props = defineProps<{ items: { label: string; value: number }[] }>()

const max = computed(() => Math.max(1, ...props.items.map((item) => item.value)))
</script>

<template>
  <ul class="bars">
    <li v-for="item in items" :key="item.label">
      <span class="label">{{ item.label }}</span>
      <span class="track" aria-hidden="true">
        <span class="fill" :style="{ width: `${(item.value / max) * 100}%` }" />
      </span>
      <span class="value">{{ formatNumber(item.value) }}</span>
    </li>
  </ul>
</template>

<style scoped>
.bars {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

li {
  display: grid;
  grid-template-columns: minmax(90px, 30%) 1fr 3.5em;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track {
  height: 14px;
  background: var(--field);
  box-shadow: var(--sunken);
}

.fill {
  display: block;
  height: 100%;
  min-width: 2px;
  background: var(--navy);
}

.value {
  font: 13px var(--font-text);
  text-align: right;
}
</style>
