<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { getMyStats, listMyLibrary } from '@/api/me'
import { statusLabel } from '@/lib/labels'
import { useAuthStore } from '@/stores/auth'
import type { EntryStatus } from '@/types/api'
import AppWindow from './AppWindow.vue'
import PixelStar from './PixelStar.vue'

const COUNTED: EntryStatus[] = ['PLAYED', 'PLAYING', 'BACKLOG', 'WISHLIST']

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const userId = computed(() => auth.user?.id)
const loggedIn = computed(() => auth.isLoggedIn)

const { data: stats } = useQuery({
  queryKey: ['me', userId, 'stats'],
  queryFn: getMyStats,
  enabled: loggedIn,
})
const { data: playing } = useQuery({
  queryKey: ['me', userId, 'playing'],
  queryFn: () => listMyLibrary({ status: ['PLAYING'], size: 3 }),
  enabled: loggedIn,
})

/** Depois de entrar, volta para onde estava (menos se já estiver no login ou no cadastro). */
const loginRoute = computed(() =>
  route.name === 'login' || route.name === 'signup'
    ? { name: 'login' }
    : { name: 'login', query: { redirect: route.fullPath } },
)

async function logout() {
  await auth.logout()
  await router.push({ name: 'home' })
}
</script>

<template>
  <AppWindow v-if="auth.user" :title="`${auth.user.username}.exe`" tone="pink">
    <div class="who">
      <strong>{{ auth.user.displayName ?? auth.user.username }}</strong>
      <span class="prose">@{{ auth.user.username }}</span>
    </div>

    <dl class="counts">
      <div v-for="status in COUNTED" :key="status">
        <dt>{{ statusLabel[status] }}</dt>
        <dd>{{ stats?.byStatus[status] ?? '—' }}</dd>
      </div>
    </dl>

    <fieldset class="playing">
      <legend>Jogando agora</legend>
      <ul v-if="playing?.content.length">
        <li v-for="entry in playing.content" :key="entry.game.id">
          <RouterLink :to="{ name: 'game', params: { slug: entry.game.slug } }">
            <img v-if="entry.game.coverUrl" :src="entry.game.coverUrl" alt="" loading="lazy" />
            <span v-else class="thumb" aria-hidden="true" />
            {{ entry.game.title }}
          </RouterLink>
        </li>
      </ul>
      <p v-else class="prose empty">
        Nada em andamento. <RouterLink :to="{ name: 'explore' }">Explore jogos</RouterLink>
      </p>
    </fieldset>

    <nav class="links">
      <RouterLink class="button" :to="{ name: 'feed' }">Feed</RouterLink>
      <RouterLink class="button" :to="{ name: 'for-you' }">Para você</RouterLink>
      <RouterLink
        class="button"
        :to="{ name: 'profile', params: { username: auth.user.username } }"
      >
        Meu perfil
      </RouterLink>
      <RouterLink class="button" :to="{ name: 'settings' }">Configurações</RouterLink>
      <RouterLink v-if="auth.user.role === 'ADMIN'" class="button" :to="{ name: 'moderation' }">
        Moderação
      </RouterLink>
      <button type="button" @click="logout">Sair</button>
    </nav>
  </AppWindow>

  <AppWindow v-else title="Bem-vindo.exe" tone="pink">
    <div class="welcome">
      <PixelStar class="star" />
      <p class="prose">
        Entre para registrar o que jogou, dar notas em estrelas e montar sua
        <mark>lista de desejos</mark>.
      </p>
    </div>
    <nav class="links">
      <RouterLink class="button" :to="loginRoute">Entrar</RouterLink>
      <RouterLink class="button" :to="{ name: 'signup' }">Criar conta</RouterLink>
    </nav>
  </AppWindow>
</template>

<style scoped>
.who {
  display: grid;
  gap: 2px;
  margin-bottom: 12px;
  padding: 10px;
  background: var(--pastel);
  box-shadow: var(--sunken);
}

.who strong {
  overflow-wrap: anywhere;
  font-size: 18px;
}

.who span {
  font-size: 13px;
}

.counts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 0 0 12px;
}

.counts div {
  display: flex;
  flex-direction: column-reverse;
  padding: 4px 6px;
  box-shadow: var(--etched);
}

.counts dt {
  font-size: 12px;
}

.counts dd {
  margin: 0;
  font: 16px var(--font-display);
}

.playing {
  margin-bottom: 12px;
}

.playing ul {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.playing a {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text);
  font-size: 14px;
  text-decoration: none;
}

.playing a:is(:hover, :focus-visible) {
  background: var(--navy);
  color: var(--white);
}

.playing img,
.thumb {
  flex: none;
  width: 30px;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  box-shadow: var(--sunken);
}

.thumb {
  background: repeating-conic-gradient(var(--teal) 0 25%, var(--navy) 0 50%) 0 0 / 4px 4px;
}

.empty {
  margin: 0;
  font-size: 13px;
}

.welcome {
  display: grid;
  justify-items: center;
  gap: 10px;
  margin-bottom: 12px;
  text-align: center;
}

.welcome p {
  margin: 0;
}

.star {
  width: 40px;
  color: var(--star);
  filter: drop-shadow(2px 2px 0 var(--black));
}

.links {
  display: grid;
  gap: 6px;
}
</style>
