<script setup lang="ts">
defineProps<{ items?: string[] }>()
</script>

<template>
  <section class="construction">
    <span class="tape" aria-hidden="true" />
    <h2>Em construção</h2>
    <ul v-if="items?.length" class="prose">
      <li v-for="item in items" :key="item">{{ item }}</li>
    </ul>
    <span class="tape" aria-hidden="true" />
  </section>
</template>

<style scoped>
.construction {
  display: grid;
  gap: 12px;
  padding: 12px;
  background: var(--field);
  box-shadow: var(--sunken);
  text-align: center;
}

.tape {
  height: 12px;
  background: repeating-linear-gradient(-45deg, var(--yellow) 0 10px, var(--black) 0 20px);
}

h2 {
  font: 14px/1.6 var(--font-display);
}

ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

li::before {
  content: '> ';
}
</style>
