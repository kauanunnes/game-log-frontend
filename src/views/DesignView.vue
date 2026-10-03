<script setup lang="ts">
import { ref } from 'vue'
import AppWindow from '@/components/AppWindow.vue'
import ErrorMessage from '@/components/ErrorMessage.vue'
import GameCard from '@/components/GameCard.vue'
import GameCardSkeleton from '@/components/GameCardSkeleton.vue'
import PageNav from '@/components/PageNav.vue'
import StarRating from '@/components/StarRating.vue'
import UnderConstruction from '@/components/UnderConstruction.vue'
import { genderLabel } from '@/lib/labels'
import type { EntryStatus, GameSummary } from '@/types/api'

const swatches = [
  'desktop',
  'surface',
  'navy',
  'blue',
  'pink',
  'pink-deep',
  'aqua',
  'yellow',
  'link',
  'red',
]

const rating = ref<number | null>(4.75)

const samples: {
  game: GameSummary
  rating: number | null
  status: EntryStatus
  favorite?: boolean
}[] = [
  {
    game: {
      id: 1,
      slug: 'hollow-knight',
      title: 'Hollow Knight',
      coverUrl: null,
      releaseYear: 2017,
    },
    rating: 4.75,
    status: 'PLAYED',
    favorite: true,
  },
  {
    game: { id: 2, slug: 'celeste', title: 'Celeste', coverUrl: null, releaseYear: 2018 },
    rating: 4.5,
    status: 'PLAYED',
  },
  {
    game: {
      id: 3,
      slug: 'chrono-trigger',
      title: 'Chrono Trigger',
      coverUrl: null,
      releaseYear: 1995,
    },
    rating: 3.25,
    status: 'PLAYING',
  },
  {
    game: {
      id: 4,
      slug: 'hollow-knight-silksong',
      title: 'Silksong',
      coverUrl: null,
      releaseYear: 2025,
    },
    rating: null,
    status: 'WISHLIST',
  },
]
</script>

<template>
  <AppWindow title="Estilos.exe">
    <div class="sections">
      <fieldset>
        <legend>Cores</legend>
        <div class="swatches">
          <figure v-for="name in swatches" :key="name">
            <span :style="{ background: `var(--${name})` }" />
            <figcaption>--{{ name }}</figcaption>
          </figure>
        </div>
      </fieldset>

      <fieldset>
        <legend>Tipografia</legend>
        <p class="display">Game Log</p>
        <p>Pixelify Sans: títulos, botões e toda a interface.</p>
        <p class="prose">
          IBM Plex Mono: textos longos, números e avaliações, com <mark>marca-texto</mark> e
          <a href="#">links</a>.
        </p>
      </fieldset>

      <fieldset>
        <legend>Botões e campos</legend>
        <div class="actions">
          <button>Normal</button>
          <button disabled>Desabilitado</button>
          <RouterLink class="button" :to="{ name: 'home' }">Link como botão</RouterLink>
        </div>
        <div class="form">
          <label>Texto <input placeholder="Buscar jogo..." /></label>
          <label>
            Gênero
            <select>
              <option value="">Prefiro não informar</option>
              <option v-for="(label, value) in genderLabel" :key="value" :value="value">
                {{ label }}
              </option>
            </select>
          </label>
          <label>Avaliação <textarea rows="3" placeholder="O que você achou?" /></label>
          <label class="check"><input type="checkbox" checked /> Recomendo este jogo</label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Nota</legend>
        <StarRating v-model="rating" label="Sua nota" />
        <p class="prose hint">
          Clique nas estrelas ou use as setas (passos de 0,25). Delete limpa.
        </p>
        <div class="ratings">
          <StarRating
            v-for="value in [0, 1.5, 3.25, 5]"
            :key="value"
            :model-value="value"
            readonly
          />
        </div>
      </fieldset>

      <fieldset>
        <legend>Cards</legend>
        <div class="grid">
          <GameCard v-for="sample in samples" :key="sample.game.id" v-bind="sample" />
        </div>
      </fieldset>

      <fieldset>
        <legend>Carregando, erro e paginação</legend>
        <div class="grid">
          <GameCardSkeleton v-for="n in 2" :key="n" />
        </div>
        <ErrorMessage>Não foi possível carregar os jogos. Sem conexão com o servidor.</ErrorMessage>
        <PageNav :page="2" :total-pages="5" />
      </fieldset>

      <fieldset>
        <legend>Em construção</legend>
        <UnderConstruction :items="['Use em telas que ainda não existem']" />
      </fieldset>
    </div>
  </AppWindow>

  <AppWindow title="Janela rosa.exe" tone="pink">
    <p class="prose">Para destaques, como o "Você poderá gostar".</p>
    <template #status>
      <span>Pronto</span>
      <span>Status bar</span>
    </template>
  </AppWindow>
</template>

<style scoped>
.sections {
  display: grid;
  gap: 16px;
}

.swatches {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 8px;
}

figure {
  display: grid;
  gap: 4px;
  margin: 0;
}

figure span {
  height: 40px;
  box-shadow: var(--sunken);
}

figcaption {
  font: 12px var(--font-text);
}

p {
  margin: 0;
}

.display {
  font: 20px var(--font-display);
}

.actions {
  justify-content: flex-start;
}

.form label.check {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ratings {
  display: grid;
  gap: 4px;
}

.hint {
  color: var(--muted);
  font-size: 13px;
}
</style>
