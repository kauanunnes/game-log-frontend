<script setup lang="ts">
import { computed, ref } from 'vue'
import { reportReview } from '@/api/games'
import { reportReasonLabel } from '@/lib/labels'
import { useSubmit } from '@/lib/useSubmit'
import { useAuthStore } from '@/stores/auth'
import type { PublicReview, ReportReason } from '@/types/api'
import AppWindow from './AppWindow.vue'

const props = defineProps<{ review: PublicReview }>()

const REASONS = Object.keys(reportReasonLabel) as ReportReason[]

const auth = useAuthStore()
/** Só quem está logado, e nunca na própria avaliação. */
const shown = computed(() => auth.user && auth.user.username !== props.review.user.username)

const dialog = ref<HTMLDialogElement>()
const reason = ref<ReportReason>('SPAM')
const details = ref('')
const sent = ref(false)

const { busy, error, done, submit } = useSubmit(async () => {
  await reportReview(props.review.id, reason.value, details.value)
  sent.value = true
})

function open() {
  reason.value = 'SPAM'
  details.value = ''
  error.value = null
  done.value = false
  dialog.value?.showModal()
}
</script>

<template>
  <template v-if="shown">
    <button type="button" class="report" :disabled="sent" @click="open">
      {{ sent ? 'Denunciada' : 'Denunciar' }}
    </button>
    <dialog ref="dialog" class="report-dialog">
      <AppWindow title="Denunciar avaliação.exe">
        <template v-if="done">
          <p class="prose success" role="status">Denúncia enviada. A moderação vai olhar.</p>
          <div class="actions">
            <button type="button" @click="dialog?.close()">Fechar</button>
          </div>
        </template>
        <form v-else class="form" @submit.prevent="submit">
          <fieldset>
            <legend>Motivo</legend>
            <label v-for="value in REASONS" :key="value" class="choice">
              <input v-model="reason" type="radio" name="reason" :value="value" />
              {{ reportReasonLabel[value] }}
            </label>
          </fieldset>
          <label>
            Detalhes (opcional)
            <textarea v-model="details" rows="3" maxlength="500" />
          </label>
          <p v-if="error" class="error" role="alert">{{ error }}</p>
          <div class="actions">
            <button type="button" @click="dialog?.close()">Cancelar</button>
            <button type="submit" :disabled="busy">Denunciar</button>
          </div>
        </form>
      </AppWindow>
    </dialog>
  </template>
</template>

<style scoped>
.report {
  padding: 2px 8px;
  font: 12px var(--font-text);
}

.report-dialog {
  width: min(440px, calc(100vw - 32px));
  padding: 0;
  border: 0;
  background: none;
}

.report-dialog::backdrop {
  background: var(--backdrop);
}

.success {
  margin: 0 0 12px;
}
</style>
