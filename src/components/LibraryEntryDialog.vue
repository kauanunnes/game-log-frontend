<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { errorMessage } from '@/api/client'
import { listPlatforms, listStores } from '@/api/games'
import { removeMyEntry, saveMyEntry } from '@/api/me'
import { allows, partLabel, type EntryPart } from '@/lib/entryRules'
import { currencyOptions } from '@/lib/format'
import { acquisitionLabel, statusLabel } from '@/lib/labels'
import { useAuthStore } from '@/stores/auth'
import type { AcquisitionMethod, EntryStatus, LibraryEntry, LibraryEntryRequest } from '@/types/api'
import AppWindow from './AppWindow.vue'
import StarRating from './StarRating.vue'

const props = defineProps<{
  open: boolean
  game: { id: number; slug: string; title: string }
  entry: LibraryEntry | null
}>()
const emit = defineEmits<{ close: [] }>()

const STATUSES: EntryStatus[] = ['WISHLIST', 'BACKLOG', 'PLAYING', 'PLAYED', 'DROPPED']
const METHODS = Object.keys(acquisitionLabel) as AcquisitionMethod[]
const today = new Date().toISOString().slice(0, 10)

const auth = useAuthStore()
const queryClient = useQueryClient()
const { data: platforms } = useQuery({ queryKey: ['platforms'], queryFn: listPlatforms })
const { data: stores } = useQuery({ queryKey: ['stores'], queryFn: listStores })

/** Estado plano para o v-model; vira o corpo do PUT em {@link toRequest}. */
interface Form {
  status: EntryStatus
  favorite: boolean
  rating: number | null
  recommends: boolean | null
  text: string
  hasSpoilers: boolean
  platformId: number | null
  hoursPlayed: number | '' | null
  startedOn: string
  finishedOn: string
  completed: boolean
  method: AcquisitionMethod | null
  storeId: number | null
  price: string
  currency: string
  acquiredOn: string
}

function fromEntry(entry: LibraryEntry | null): Form {
  return {
    status: entry?.status ?? 'BACKLOG',
    favorite: entry?.favorite ?? false,
    rating: entry?.review?.rating ?? null,
    recommends: entry?.review?.recommends ?? null,
    text: entry?.review?.text ?? '',
    hasSpoilers: entry?.review?.hasSpoilers ?? false,
    platformId: entry?.playthrough?.platformId ?? null,
    hoursPlayed: entry?.playthrough?.hoursPlayed ?? null,
    startedOn: entry?.playthrough?.startedOn ?? '',
    finishedOn: entry?.playthrough?.finishedOn ?? '',
    completed: entry?.playthrough?.completed ?? false,
    method: entry?.acquisition?.method ?? null,
    storeId: entry?.acquisition?.storeId ?? null,
    price: entry?.acquisition?.price?.amount.replace('.', ',') ?? '',
    currency: entry?.acquisition?.price?.currency ?? auth.user?.defaultCurrency ?? 'BRL',
    acquiredOn: entry?.acquisition?.acquiredOn ?? '',
  }
}

const form = ref<Form>(fromEntry(props.entry))
const may = (part: EntryPart) => allows(form.value.status, part)
const hours = (value: Form['hoursPlayed']) => (typeof value === 'number' ? value : null)
const hasReview = (f: Form) => f.rating !== null || f.recommends !== null || f.text.trim() !== ''

/** O que já está preenchido e não cabe no status escolhido: sai ao salvar (RN02). */
const dropped = computed(() => {
  const f = form.value
  const filled: [EntryPart, boolean][] = [
    ['review', hasReview(f)],
    ['playthrough', f.platformId !== null || hours(f.hoursPlayed) !== null || f.startedOn !== ''],
    ['finishedOn', f.finishedOn !== ''],
    ['completed', f.completed],
    ['favorite', f.favorite],
    ['acquisition', f.method !== null],
  ]
  return filled.filter(([part, has]) => has && !may(part)).map(([part]) => partLabel[part])
})

function toRequest(f: Form): LibraryEntryRequest {
  const playthrough = {
    platformId: may('playthrough') ? f.platformId : null,
    hoursPlayed: may('playthrough') ? hours(f.hoursPlayed) : null,
    startedOn: may('playthrough') ? f.startedOn || null : null,
    finishedOn: may('finishedOn') ? f.finishedOn || null : null,
    completed: may('completed') && f.completed ? true : null,
  }
  const price = f.price.trim().replace(',', '.')
  return {
    status: f.status,
    favorite: may('favorite') && f.favorite,
    review:
      may('review') && hasReview(f)
        ? {
            rating: f.rating,
            recommends: f.recommends,
            text: f.text.trim() || null,
            hasSpoilers: f.hasSpoilers,
          }
        : null,
    playthrough: Object.values(playthrough).some((value) => value !== null) ? playthrough : null,
    acquisition:
      may('acquisition') && f.method
        ? {
            method: f.method,
            storeId: f.storeId,
            price:
              f.method === 'PURCHASED' && price ? { amount: price, currency: f.currency } : null,
            acquiredOn: f.acquiredOn || null,
          }
        : null,
  }
}

const dialog = ref<HTMLDialogElement>()
const error = ref<string | null>(null)
const busy = ref(false)

watch(
  () => props.open,
  (open) => {
    if (open) {
      form.value = fromEntry(props.entry)
      error.value = null
      dialog.value?.showModal()
    } else {
      dialog.value?.close()
    }
  },
)

async function run(action: () => Promise<unknown>) {
  busy.value = true
  error.value = null
  try {
    await action()
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['me'] }),
      queryClient.invalidateQueries({ queryKey: ['profile'] }),
      queryClient.invalidateQueries({ queryKey: ['game', props.game.slug] }),
      queryClient.invalidateQueries({ queryKey: ['game-reviews', props.game.slug] }),
      queryClient.invalidateQueries({ queryKey: ['reviews'] }),
    ])
    emit('close')
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}

const save = () => run(() => saveMyEntry(props.game.id, toRequest(form.value)))

function remove() {
  if (window.confirm(`Remover ${props.game.title} da sua biblioteca?`)) {
    void run(() => removeMyEntry(props.game.id))
  }
}
</script>

<template>
  <dialog ref="dialog" class="entry-dialog" @close="emit('close')">
    <AppWindow :title="`${entry ? 'Editar' : 'Registrar'}: ${game.title}.exe`">
      <form class="form" @submit.prevent="save">
        <fieldset>
          <legend>Status</legend>
          <div class="statuses">
            <label v-for="status in STATUSES" :key="status" class="choice">
              <input v-model="form.status" type="radio" name="status" :value="status" />
              {{ statusLabel[status] }}
            </label>
          </div>
          <label v-if="may('favorite')" class="choice">
            <input v-model="form.favorite" type="checkbox" /> Favorito
          </label>
        </fieldset>

        <fieldset v-if="may('review')" class="review">
          <legend>Avaliação</legend>
          <div class="rating">
            <StarRating v-model="form.rating" label="Sua nota" />
            <button v-if="form.rating !== null" type="button" @click="form.rating = null">
              Sem nota
            </button>
          </div>
          <div class="choices" role="radiogroup" aria-label="Recomenda?">
            <span>Recomenda?</span>
            <label class="choice">
              <input v-model="form.recommends" type="radio" name="recommends" :value="true" /> Sim
            </label>
            <label class="choice">
              <input v-model="form.recommends" type="radio" name="recommends" :value="false" />
              Não
            </label>
            <label class="choice">
              <input v-model="form.recommends" type="radio" name="recommends" :value="null" /> Sem
              resposta
            </label>
          </div>
          <label>
            O que você achou?
            <textarea v-model="form.text" rows="4" maxlength="2000" />
            <small class="hint counter">{{ form.text.length }}/2000</small>
          </label>
          <label class="choice">
            <input v-model="form.hasSpoilers" type="checkbox" /> Contém spoiler
          </label>
        </fieldset>

        <fieldset v-if="may('playthrough')" class="pair">
          <legend>Jogatina</legend>
          <label>
            Plataforma
            <select v-model="form.platformId">
              <option :value="null">—</option>
              <option v-for="platform in platforms" :key="platform.id" :value="platform.id">
                {{ platform.name }}
              </option>
            </select>
          </label>
          <label>
            Horas jogadas
            <input v-model.number="form.hoursPlayed" type="number" min="0" max="100000" />
          </label>
          <label>
            Início
            <input v-model="form.startedOn" type="date" :max="today" />
          </label>
          <label v-if="may('finishedOn')">
            Término
            <input
              v-model="form.finishedOn"
              type="date"
              :min="form.startedOn || undefined"
              :max="today"
            />
          </label>
          <label v-if="may('completed')" class="choice">
            <input v-model="form.completed" type="checkbox" /> Zerei
          </label>
        </fieldset>

        <fieldset v-if="may('acquisition')" class="pair">
          <legend>Aquisição</legend>
          <label>
            Como conseguiu
            <select v-model="form.method">
              <option :value="null">—</option>
              <option v-for="method in METHODS" :key="method" :value="method">
                {{ acquisitionLabel[method] }}
              </option>
            </select>
          </label>
          <label v-if="form.method">
            Loja
            <select v-model="form.storeId">
              <option :value="null">—</option>
              <option v-for="store in stores" :key="store.id" :value="store.id">
                {{ store.name }}
              </option>
            </select>
          </label>
          <template v-if="form.method === 'PURCHASED'">
            <label>
              Valor pago
              <input
                v-model="form.price"
                inputmode="decimal"
                pattern="\d{1,8}([.,]\d{1,2})?"
                title="Até duas casas decimais, como 46,99"
                placeholder="0,00"
              />
            </label>
            <label>
              Moeda
              <select v-model="form.currency">
                <option v-for="currency in currencyOptions(form.currency)" :key="currency">
                  {{ currency }}
                </option>
              </select>
            </label>
          </template>
          <label v-if="form.method">
            Data
            <input v-model="form.acquiredOn" type="date" :max="today" />
          </label>
        </fieldset>

        <p v-if="dropped.length" class="warning prose" role="status">
          Ao salvar como {{ statusLabel[form.status] }},
          {{ dropped.length === 1 ? 'sai' : 'saem' }}: {{ dropped.join(', ') }}.
        </p>
        <p v-if="error" class="error" role="alert">{{ error }}</p>

        <div class="buttons">
          <button v-if="entry" type="button" class="remove" :disabled="busy" @click="remove">
            Remover
          </button>
          <button type="button" :disabled="busy" @click="emit('close')">Cancelar</button>
          <button type="submit" :disabled="busy">Salvar</button>
        </div>
      </form>
    </AppWindow>
  </dialog>
</template>

<style scoped>
.entry-dialog {
  width: min(560px, calc(100vw - 32px));
  max-height: calc(100dvh - 32px);
  padding: 0;
  border: 0;
  background: none;
  overflow: auto;
}

.entry-dialog::backdrop {
  background: rgb(0 0 0 / 35%);
}

.statuses {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
}

.rating {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rating button {
  min-width: 0;
  font-size: 13px;
}

.choices {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 14px;
}

.counter {
  justify-self: end;
}

.pair {
  grid-template-columns: repeat(auto-fit, minmax(min(200px, 100%), 1fr));
}

.pair :is(input:not([type='checkbox']), select) {
  width: 100%;
  min-width: 0;
}

.warning {
  margin: 0;
  padding: 8px 10px;
  background: var(--yellow);
  box-shadow: var(--sunken);
}

.buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.remove {
  margin-right: auto;
  color: var(--red);
}
</style>
