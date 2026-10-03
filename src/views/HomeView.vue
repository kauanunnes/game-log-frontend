<script setup lang="ts">
import AppWindow from '@/components/AppWindow.vue'
import PixelStar from '@/components/PixelStar.vue'
import UnderConstruction from '@/components/UnderConstruction.vue'

/** Recado de quem mandou para cá, como a exclusão da conta. */
const notice: string | undefined = history.state?.notice
</script>

<template>
  <AppWindow title="GameLog.exe" tone="pink">
    <p v-if="notice" class="prose notice" role="status">{{ notice }}</p>
    <div class="hero">
      <PixelStar class="star" />
      <h2 class="logo">Game<br />Log</h2>
      <p class="prose">
        Registre o que você jogou, o que achou e quanto pagou. Monte sua
        <mark>lista de desejos</mark> e mostre tudo no seu perfil.
      </p>
      <div class="actions">
        <RouterLink class="button" :to="{ name: 'explore' }">Explorar jogos</RouterLink>
        <RouterLink class="button" :to="{ name: 'signup' }">Criar conta</RouterLink>
      </div>
    </div>
    <template #status>
      <span>Pronto</span>
      <span>v0.1</span>
    </template>
  </AppWindow>

  <AppWindow title="Em alta.exe">
    <UnderConstruction :items="['Jogos mais adicionados na semana', 'Avaliações recentes']" />
  </AppWindow>
</template>

<style scoped>
.hero {
  display: grid;
  justify-items: center;
  gap: 16px;
  padding: 32px 16px;
  background: var(--pastel);
  box-shadow: var(--sunken);
  text-align: center;
}

.star {
  width: 56px;
  color: var(--star);
  filter: drop-shadow(3px 3px 0 var(--black));
}

.logo {
  color: var(--white);
  font: clamp(24px, 7vw, 44px) / 1.3 var(--font-display);
  text-shadow:
    3px 3px var(--pink-deep),
    6px 6px var(--black);
  text-transform: uppercase;
}

.prose {
  max-width: 52ch;
  margin: 0;
}

.actions {
  justify-content: center;
}

.notice {
  margin: 0 0 12px;
  padding: 10px 12px;
  background: var(--yellow);
  box-shadow: var(--sunken);
}
</style>
