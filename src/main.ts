import '@fontsource/press-start-2p'
import '@fontsource/pixelify-sans/400.css'
import '@fontsource/pixelify-sans/700.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/700.css'
import './styles/tokens.css'
import './styles/base.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import App from './App.vue'
import { queryClient } from './api/queryClient'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App).use(createPinia()).use(VueQueryPlugin, { queryClient })
await useAuthStore().restore()
app.use(router).mount('#app')
