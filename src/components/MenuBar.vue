<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import PixelStar from './PixelStar.vue'

interface Item {
  label: string
  to?: RouteLocationRaw
  href?: string
  action?: () => void
}

interface Menu {
  id: string
  label: string
  items: Item[]
}

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const bar = ref<HTMLElement>()
const open = ref<string | null>(null)

const now = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
const time = ref(now())
const timer = setInterval(() => (time.value = now()), 10_000)

/** Depois de entrar, volta para onde estava (menos se já estiver no login ou no cadastro). */
const loginRoute = computed<RouteLocationRaw>(() =>
  route.name === 'login' || route.name === 'signup'
    ? { name: 'login' }
    : { name: 'login', query: { redirect: route.fullPath } },
)

async function logout() {
  await auth.logout()
  await router.push({ name: 'home' })
}

const menus = computed<Menu[]>(() => [
  {
    id: 'games',
    label: 'Jogos',
    items: [
      { label: 'Início', to: { name: 'home' } },
      { label: 'Explorar jogos', to: { name: 'explore' } },
      { label: 'Em alta', to: { name: 'explore', query: { sort: 'trending' } } },
      { label: 'Lançamentos', to: { name: 'explore', query: { sort: 'release' } } },
    ],
  },
  auth.user
    ? {
        id: 'user',
        label: auth.user.username,
        items: [
          {
            label: 'Meu perfil',
            to: { name: 'profile', params: { username: auth.user.username } },
          },
          { label: 'Para você', to: { name: 'for-you' } },
          { label: 'Feed', to: { name: 'feed' } },
          { label: 'Configurações', to: { name: 'settings' } },
          ...(auth.user.role === 'ADMIN'
            ? [{ label: 'Moderação', to: { name: 'moderation' } }]
            : []),
          { label: 'Sair', action: logout },
        ],
      }
    : {
        id: 'user',
        label: 'Usuário',
        items: [
          { label: 'Entrar', to: loginRoute.value },
          { label: 'Criar conta', to: { name: 'signup' } },
          { label: 'Esqueci minha senha', to: { name: 'forgot-password' } },
        ],
      },
  {
    id: 'help',
    label: 'Ajuda',
    items: [
      { label: 'Código no GitHub', href: 'https://github.com/kauanunnes/game-log-frontend' },
      { label: 'Dados do IGDB', href: 'https://www.igdb.com' },
    ],
  },
])

function toggle(id: string) {
  open.value = open.value === id ? null : id
}

/** Com um menu aberto, passar o mouse em outro troca de menu, como no Windows. */
function hover(id: string) {
  if (open.value) open.value = id
}

function close() {
  const id = open.value
  open.value = null
  if (id) bar.value?.querySelector<HTMLButtonElement>(`[aria-controls="menu-${id}"]`)?.focus()
}

function onDocumentClick(event: MouseEvent) {
  if (!bar.value?.contains(event.target as Node)) open.value = null
}

watch(
  () => route.fullPath,
  () => (open.value = null),
)
onMounted(() => document.addEventListener('click', onDocumentClick))
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  clearInterval(timer)
})
</script>

<template>
  <header class="menubar">
    <nav ref="bar" aria-label="Menu principal" @keydown.esc="close">
      <RouterLink class="brand" :to="{ name: 'home' }">
        <PixelStar class="logo" /><span class="brand-name">Game Log</span>
      </RouterLink>
      <ul class="menus">
        <li v-for="menu in menus" :key="menu.id" @mouseenter="hover(menu.id)">
          <button
            type="button"
            :aria-expanded="open === menu.id"
            :aria-controls="`menu-${menu.id}`"
            @click="toggle(menu.id)"
          >
            {{ menu.label }}
          </button>
          <ul v-show="open === menu.id" :id="`menu-${menu.id}`" class="dropdown">
            <li v-for="item in menu.items" :key="item.label">
              <RouterLink v-if="item.to" :to="item.to">{{ item.label }}</RouterLink>
              <a v-else-if="item.href" :href="item.href" target="_blank" rel="noopener">
                {{ item.label }}
              </a>
              <button v-else type="button" @click="item.action">{{ item.label }}</button>
            </li>
          </ul>
        </li>
      </ul>
      <time class="tray">{{ time }}</time>
    </nav>
  </header>
</template>

<style scoped>
.menubar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--surface);
  box-shadow:
    inset 0 -1px var(--gray),
    0 1px var(--white);
}

nav {
  display: flex;
  align-items: center;
  gap: 4px;
  max-width: 1320px;
  height: var(--menubar-height);
  margin: 0 auto;
  padding: 0 12px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-right: 8px;
  color: var(--text);
  font: 12px var(--font-display);
  text-decoration: none;
  white-space: nowrap;
}

.logo {
  width: 18px;
  color: var(--star);
  filter: drop-shadow(1px 1px 0 var(--black));
}

ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.menus {
  display: flex;
  flex: 1;
  min-width: 0;
}

.menus > li {
  position: relative;
}

/* Itens do menu são texto, como no Windows: sem o relevo dos botões. */
.menus > li > button {
  min-height: 0;
  max-width: 180px;
  overflow: hidden;
  padding: 4px 10px;
  background: none;
  box-shadow: none;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menus > li > button:is(:hover, :focus-visible, [aria-expanded='true']) {
  background: var(--navy);
  color: var(--white);
  outline: none;
}

.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 200px;
  padding: 3px;
  background: var(--surface);
  box-shadow: var(--window);
}

.dropdown :is(a, button) {
  display: block;
  width: 100%;
  min-height: 0;
  padding: 7px 24px 7px 12px;
  background: none;
  box-shadow: none;
  color: var(--text);
  text-align: left;
  text-decoration: none;
  white-space: nowrap;
}

.dropdown :is(a, button):is(:hover, :focus-visible) {
  background: var(--navy);
  color: var(--white);
  outline: none;
}

.tray {
  padding: 2px 10px;
  box-shadow:
    inset 1px 1px var(--gray),
    inset -1px -1px var(--white);
  font: 14px var(--font-text);
}

@media (max-width: 480px) {
  .tray,
  .brand-name {
    display: none;
  }
}
</style>
