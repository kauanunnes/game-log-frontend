<script setup lang="ts">
import { computed, toRef } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { ApiError } from '@/api/client'
import AppWindow from '@/components/AppWindow.vue'
import ErrorMessage from '@/components/ErrorMessage.vue'
import FollowButton from '@/components/FollowButton.vue'
import TabPanel from '@/components/TabPanel.vue'
import { formatDate, formatNumber } from '@/lib/format'
import { genderLabel } from '@/lib/labels'
import { useProfileSource } from '@/lib/profileSource'
import { profileTabs } from '@/router/tabs'
import type { LibraryCounts } from '@/types/api'

const props = defineProps<{ username: string }>()
const username = toRef(props, 'username')

const source = useProfileSource(username)
const { isOwner } = source

/** O dono recebe o cabeçalho completo mesmo com o perfil privado. */
const {
  data: profile,
  error,
  refetch,
} = useQuery({
  queryKey: ['profile', username, isOwner, 'header'],
  queryFn: source.header,
})

/** RN14: o gênero aparece só se a pessoa informou. */
const handle = computed(() => {
  const value = profile.value
  if (!value) return ''
  return value.gender ? `@${value.username} · ${genderLabel[value.gender]}` : `@${value.username}`
})

const notFound = computed(
  () => error.value instanceof ApiError && error.value.problem.status === 404,
)
const locked = computed(() => profile.value?.private && !isOwner.value)

const COUNTERS: [keyof LibraryCounts, string][] = [
  ['played', 'Jogados'],
  ['playing', 'Jogando'],
  ['backlog', 'Quero jogar'],
  ['wishlist', 'Lista de desejos'],
  ['favorites', 'Favoritos'],
  ['reviews', 'Avaliações'],
]

const tabs = computed(() =>
  profileTabs.map(({ name, label }) => ({
    label,
    to: { name, params: { username: username.value } },
  })),
)
</script>

<template>
  <AppWindow :title="`${username}.exe`">
    <div v-if="notFound" class="not-found">
      <span class="error-icon" aria-hidden="true">×</span>
      <p class="prose">
        Ninguém usa o username <b>{{ username }}</b
        >.
      </p>
    </div>
    <ErrorMessage v-else-if="error" @retry="refetch()">
      Não foi possível carregar o perfil. {{ error.message }}
    </ErrorMessage>

    <template v-else-if="profile">
      <header class="header">
        <h2>{{ profile.displayName ?? profile.username }}</h2>
        <p class="prose handle">{{ handle }}</p>
        <p v-if="profile.bio" class="prose bio">{{ profile.bio }}</p>
        <p v-if="profile.memberSince" class="prose since">
          Membro desde {{ formatDate(profile.memberSince) }}
        </p>
        <p v-if="profile.counts" class="prose follows">
          <RouterLink :to="{ name: 'profile-followers', params: { username } }">
            <b>{{ formatNumber(profile.counts.followers) }}</b>
            {{ profile.counts.followers === 1 ? 'seguidor' : 'seguidores' }}
          </RouterLink>
          ·
          <RouterLink :to="{ name: 'profile-following', params: { username } }">
            <b>{{ formatNumber(profile.counts.following) }}</b> seguindo
          </RouterLink>
        </p>
        <FollowButton v-if="!isOwner" :username="username" />
        <dl v-if="profile.counts" class="counters">
          <div v-for="[key, label] in COUNTERS" :key="key">
            <dt>{{ label }}</dt>
            <dd>{{ formatNumber(profile.counts[key]) }}</dd>
          </div>
        </dl>
      </header>

      <p v-if="locked" class="locked prose">Este perfil é privado.</p>
      <template v-else>
        <p v-if="profile.private" class="prose notice">
          Seu perfil está privado: só você vê as abas.
        </p>
        <TabPanel :tabs="tabs"><RouterView /></TabPanel>
      </template>
    </template>
  </AppWindow>
</template>

<style scoped>
.header {
  display: grid;
  justify-items: center;
  gap: 6px;
  padding-bottom: 16px;
  text-align: center;
}

h2 {
  font-size: 24px;
}

p {
  margin: 0;
}

.handle,
.since {
  color: var(--muted);
  font-size: 14px;
}

.bio {
  max-width: 60ch;
}

.follows {
  font-size: 14px;
}

.counters {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px 24px;
  margin: 8px 0 0;
}

.counters div {
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
}

.counters dt {
  font-size: 13px;
}

.counters dd {
  margin: 0;
  font: 18px var(--font-display);
}

.locked,
.notice {
  padding: 10px 12px;
  background: var(--field);
  box-shadow: var(--sunken);
  text-align: center;
}

.notice {
  margin-bottom: 12px;
  background: var(--notice);
}

.not-found {
  display: flex;
  align-items: center;
  gap: 16px;
}
</style>
