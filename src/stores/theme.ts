import { ref } from 'vue'
import { defineStore } from 'pinia'

/** Claro e escuro vão em data-theme, na raiz; "system" tira o atributo, e o CSS segue o sistema. */
export type Theme = 'light' | 'dark' | 'system'

/** A mesma do script no index.html, que aplica a escolha antes da primeira pintura. */
const KEY = 'game-log:theme'

function saved(): Theme {
  try {
    const value = localStorage.getItem(KEY)
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch {
    return 'system'
  }
}

function apply(theme: Theme) {
  if (theme === 'system') delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = theme
}

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>(saved())
  apply(theme.value)

  function choose(value: Theme) {
    theme.value = value
    apply(value)
    try {
      if (value === 'system') localStorage.removeItem(KEY)
      else localStorage.setItem(KEY, value)
    } catch {
      // Sem armazenamento, como em algumas abas anônimas, a escolha vale até recarregar
    }
  }

  return { theme, choose }
})
