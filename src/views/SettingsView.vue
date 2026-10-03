<script setup lang="ts">
import AppWindow from '@/components/AppWindow.vue'
import TabPanel from '@/components/TabPanel.vue'
import { settingsTabs } from '@/router/tabs'

const tabs = settingsTabs.map(({ name, label }) => ({ label, to: { name } }))
</script>

<template>
  <AppWindow title="Configurações.exe">
    <TabPanel :tabs="tabs"><RouterView /></TabPanel>
  </AppWindow>
</template>
