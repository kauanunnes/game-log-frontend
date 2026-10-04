<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { follow, isFollowing, unfollow } from '@/api/users'
import { useSubmit } from '@/lib/useSubmit'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{ username: string }>()

const auth = useAuthStore()
const route = useRoute()
const queryClient = useQueryClient()

const key = computed(() => ['me', auth.user?.id, 'following', props.username])
const { data: following } = useQuery({
  queryKey: key,
  queryFn: () => isFollowing(props.username),
  enabled: computed(() => auth.isLoggedIn),
})

const {
  busy,
  error,
  submit: toggle,
} = useSubmit(async () => {
  const next = !following.value
  await (next ? follow(props.username) : unfollow(props.username))
  queryClient.setQueryData(key.value, next)
  // Mudam os contadores e as listas dos dois perfis, e o meu feed.
  void queryClient.invalidateQueries({ queryKey: ['profile'] })
  void queryClient.invalidateQueries({ queryKey: ['me', auth.user?.id, 'feed'] })
})
</script>

<template>
  <div class="follow">
    <RouterLink
      v-if="!auth.user"
      class="button"
      :to="{ name: 'login', query: { redirect: route.fullPath } }"
    >
      Seguir
    </RouterLink>
    <button
      v-else
      type="button"
      :aria-pressed="following === true"
      :disabled="busy || following === undefined"
      :title="following ? 'Clique para deixar de seguir' : undefined"
      @click="toggle"
    >
      {{ following ? 'Seguindo' : 'Seguir' }}
    </button>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.follow {
  display: grid;
  justify-items: center;
  gap: 4px;
}

/* Botão de alternar do Win95: afundado enquanto está ligado. */
button[aria-pressed='true'] {
  box-shadow: var(--pressed);
}
</style>
