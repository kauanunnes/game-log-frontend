<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ distribution: { stars: number; count: number }[] }>()

const max = computed(() => Math.max(1, ...props.distribution.map((bucket) => bucket.count)))
const stars = (value: number) => value.toLocaleString('pt-BR')
</script>

<template>
  <figure class="histogram">
    <ul class="bars" aria-label="Quantas notas em cada faixa">
      <li
        v-for="bucket in distribution"
        :key="bucket.stars"
        :title="`${stars(bucket.stars)} estrela(s): ${bucket.count}`"
      >
        <span class="bar" :style="{ height: `${(bucket.count / max) * 100}%` }" />
        <span class="visually-hidden">{{ stars(bucket.stars) }}: {{ bucket.count }}</span>
      </li>
    </ul>
    <figcaption class="axis" aria-hidden="true"><span>0</span><span>5 ★</span></figcaption>
  </figure>
</template>

<style scoped>
.histogram {
  display: grid;
  gap: 2px;
  margin: 0;
}

.bars {
  display: grid;
  grid-template-columns: repeat(11, 1fr);
  align-items: end;
  gap: 3px;
  height: 64px;
  margin: 0;
  padding: 4px;
  background: var(--field);
  box-shadow: var(--sunken);
  list-style: none;
}

.bars li {
  display: flex;
  align-items: end;
  height: 100%;
}

.bar {
  width: 100%;
  min-height: 2px;
  background: var(--star);
  box-shadow: inset -1px -1px var(--black);
}

.axis {
  display: flex;
  justify-content: space-between;
  font: 12px var(--font-text);
}
</style>
