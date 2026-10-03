<script setup lang="ts">
import AppWindow from '@/components/AppWindow.vue'
import TabPanel from '@/components/TabPanel.vue'
import { settingsTabs } from '@/router/tabs'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const tabs = settingsTabs.map(({ name, label }) => ({ label, to: { name } }))
</script>

<template>
  <AppWindow title="Configurações.exe">
    <TabPanel :tabs="tabs">
      <!-- A rota exige login; o v-if cobre o instante entre sair e trocar de página. -->
      <RouterView v-if="auth.user" v-slot="{ Component }">
        <component :is="Component" :me="auth.user" />
      </RouterView>
    </TabPanel>
  </AppWindow>
</template>
