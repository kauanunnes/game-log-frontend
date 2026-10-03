<script setup lang="ts">
import { computed } from 'vue'
import AppWindow from '@/components/AppWindow.vue'
import TabPanel from '@/components/TabPanel.vue'
import { profileTabs } from '@/router/tabs'

const props = defineProps<{ username: string }>()

const tabs = computed(() =>
  profileTabs.map(({ name, label }) => ({
    label,
    to: { name, params: { username: props.username } },
  })),
)

const counters = ['Jogados', 'Jogando', 'Quero jogar', 'Favoritos', 'Avaliações']
</script>

<template>
  <AppWindow :title="`${username}.exe`">
    <header class="header">
      <h2>@{{ username }}</h2>
      <dl class="counters">
        <div v-for="counter in counters" :key="counter">
          <dt>{{ counter }}</dt>
          <dd>—</dd>
        </div>
      </dl>
    </header>
    <TabPanel :tabs="tabs"><RouterView /></TabPanel>
  </AppWindow>
</template>

<style scoped>
.header {
  display: grid;
  justify-items: center;
  gap: 12px;
  padding-bottom: 16px;
}

h2 {
  font-size: 22px;
}

.counters {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px 24px;
  margin: 0;
}

.counters div {
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
}

dd {
  margin: 0;
  font: 700 20px var(--font-text);
}
</style>
