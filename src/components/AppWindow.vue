<script setup lang="ts">
withDefaults(defineProps<{ title: string; tone?: 'navy' | 'pink' }>(), { tone: 'navy' })
</script>

<template>
  <section class="window">
    <header class="title-bar" :class="tone">
      <h1>{{ title }}</h1>
      <span class="controls" aria-hidden="true"><i>_</i><i>□</i><i>×</i></span>
    </header>
    <div class="body"><slot /></div>
    <footer v-if="$slots.status" class="status"><slot name="status" /></footer>
  </section>
</template>

<style scoped>
.window {
  min-width: 0;
  padding: 3px;
  background: var(--surface);
  box-shadow: var(--window);
}

.title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 3px 3px 3px 6px;
  background: var(--title-bar);
  color: var(--white);
}

.title-bar.pink {
  background: var(--title-bar-pink);
}

h1 {
  overflow: hidden;
  font-size: 15px;
  letter-spacing: 0.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.controls {
  display: flex;
  gap: 2px;
}

.controls i {
  display: grid;
  place-items: center;
  width: 18px;
  cursor: default;
  height: 16px;
  background: var(--surface);
  box-shadow: var(--raised);
  color: var(--black);
  font: 700 12px/1 var(--font-text);
}

.body {
  padding: 12px;
}

.status {
  display: flex;
  gap: 2px;
}

.status :slotted(*) {
  flex: 1;
  padding: 2px 6px;
  box-shadow:
    inset 1px 1px var(--gray),
    inset -1px -1px var(--white);
  font: 13px var(--font-text);
}
</style>
