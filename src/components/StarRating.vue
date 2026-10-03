<script setup lang="ts">
import { computed } from 'vue'
import PixelStar from './PixelStar.vue'

const props = defineProps<{ readonly?: boolean; label?: string }>()
const rating = defineModel<number | null>({ default: null })

const MAX = 5
const STEP = 0.25

const clamp = (value: number) => Math.min(MAX, Math.max(0, Math.round(value / STEP) * STEP))

const fills = computed(() =>
  Array.from({ length: MAX }, (_, i) => Math.min(1, Math.max(0, (rating.value ?? 0) - i)) * 100),
)

const text = computed(() =>
  rating.value === null ? '—' : rating.value.toLocaleString('pt-BR', { maximumFractionDigits: 2 }),
)

const a11y = computed(() =>
  props.readonly
    ? { role: 'img', 'aria-label': `${props.label ?? 'Nota'}: ${text.value} de ${MAX}` }
    : {
        role: 'slider',
        tabindex: 0,
        'aria-label': props.label ?? 'Nota',
        'aria-valuemin': 0,
        'aria-valuemax': MAX,
        'aria-valuenow': rating.value ?? 0,
        'aria-valuetext': `${text.value} de ${MAX}`,
      },
)

const keys: Record<string, (value: number) => number | null> = {
  ArrowRight: (v) => clamp(v + STEP),
  ArrowUp: (v) => clamp(v + STEP),
  ArrowLeft: (v) => clamp(v - STEP),
  ArrowDown: (v) => clamp(v - STEP),
  Home: () => 0,
  End: () => MAX,
  Delete: () => null,
  Backspace: () => null,
}

function onKeydown(event: KeyboardEvent) {
  const next = keys[event.key]
  if (props.readonly || !next) return
  event.preventDefault()
  rating.value = next(rating.value ?? 0)
}

function onPick(index: number, event: MouseEvent) {
  if (props.readonly) return
  const { left, width } = (event.currentTarget as HTMLElement).getBoundingClientRect()
  rating.value = index + Math.max(1, Math.ceil(((event.clientX - left) / width) * 4)) * STEP
}
</script>

<template>
  <span class="rating" :class="{ editable: !readonly }" v-bind="a11y" @keydown="onKeydown">
    <span v-for="(fill, i) in fills" :key="i" class="star" @click="onPick(i, $event)">
      <PixelStar />
      <span class="fill" :style="{ width: `${fill}%` }"><PixelStar /></span>
    </span>
    <span class="value" aria-hidden="true">{{ text }}</span>
  </span>
</template>

<style scoped>
.rating {
  display: inline-flex;
  align-items: center;
  gap: 0.15em;
}

.star {
  position: relative;
  color: var(--light);
}

.star svg {
  display: block;
  width: 1.2em;
  height: 1.2em;
  filter: drop-shadow(1px 1px 0 var(--black));
}

.fill {
  position: absolute;
  inset: 0 auto 0 0;
  overflow: hidden;
  color: var(--star);
}

.value {
  margin-left: 0.4em;
  font-family: var(--font-text);
}

.editable .star {
  cursor: pointer;
}
</style>
