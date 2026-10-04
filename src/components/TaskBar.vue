<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import PixelStar from './PixelStar.vue'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const open = ref(false)

const now = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
const time = ref(now())
const timer = setInterval(() => (time.value = now()), 10_000)
onBeforeUnmount(() => clearInterval(timer))

watch(
  () => route.fullPath,
  () => (open.value = false),
)

const links = computed<{ label: string; to: RouteLocationRaw }[]>(() => [
  { label: 'Início', to: { name: 'home' } },
  { label: 'Explorar jogos', to: { name: 'explore' } },
  ...(auth.user
    ? [
        { label: 'Feed', to: { name: 'feed' } },
        { label: 'Meu perfil', to: { name: 'profile', params: { username: auth.user.username } } },
        { label: 'Configurações', to: { name: 'settings' } },
      ]
    : [
        { label: 'Entrar', to: { name: 'login' } },
        { label: 'Criar conta', to: { name: 'signup' } },
      ]),
])

function onFocusOut(event: FocusEvent) {
  const root = event.currentTarget as HTMLElement
  if (!root.contains(event.relatedTarget as Node | null)) open.value = false
}

async function logout() {
  await auth.logout()
  await router.push({ name: 'home' })
}
</script>

<template>
  <footer class="taskbar">
    <div class="start" @focusout="onFocusOut" @keydown.esc="open = false">
      <button :aria-expanded="open" aria-controls="start-menu" @click="open = !open">
        <PixelStar class="logo" /> Iniciar
      </button>
      <nav v-show="open" id="start-menu" class="menu">
        <span class="brand" aria-hidden="true">Game Log</span>
        <ul>
          <li v-for="link in links" :key="link.label">
            <RouterLink :to="link.to">{{ link.label }}</RouterLink>
          </li>
          <li v-if="auth.isLoggedIn"><button @click="logout">Sair</button></li>
        </ul>
      </nav>
    </div>
    <span class="task">{{ route.meta.title ?? 'Game Log' }}</span>
    <time class="tray">{{ time }}</time>
  </footer>
</template>

<style scoped>
.taskbar {
  position: fixed;
  inset: auto 0 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 4px;
  height: var(--taskbar-height);
  padding: 4px;
  background: var(--surface);
  box-shadow:
    inset 0 1px var(--light),
    inset 0 2px var(--white);
}

.start {
  position: relative;
}

.start > button {
  min-width: 0;
  padding-inline: 6px 10px;
  font-weight: 700;
}

.start > button[aria-expanded='true'] {
  box-shadow: var(--pressed);
}

.logo {
  width: 18px;
  color: var(--star);
  filter: drop-shadow(1px 1px 0 var(--black));
}

.menu {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 0;
  display: flex;
  min-width: 230px;
  padding: 3px;
  background: var(--surface);
  box-shadow: var(--window);
}

.brand {
  padding: 8px 6px;
  background: linear-gradient(0deg, var(--navy), var(--blue));
  color: var(--light);
  font: 11px var(--font-display);
  writing-mode: vertical-rl;
  rotate: 180deg;
}

ul {
  flex: 1;
  margin: 0;
  padding: 0;
  list-style: none;
}

.menu :is(a, button) {
  display: block;
  width: 100%;
  min-height: 0;
  padding: 8px 12px;
  background: none;
  box-shadow: none;
  color: var(--text);
  text-align: left;
  text-decoration: none;
}

.menu :is(a, button):is(:hover, :focus-visible) {
  background: var(--navy);
  color: var(--white);
  outline: none;
}

.task {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  padding: 4px 10px;
  background: repeating-conic-gradient(var(--white) 0 25%, var(--surface) 0 50%) 0 0 / 2px 2px;
  box-shadow: var(--pressed);
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tray {
  padding: 4px 10px;
  box-shadow:
    inset 1px 1px var(--gray),
    inset -1px -1px var(--white);
  font: 14px var(--font-text);
}
</style>
