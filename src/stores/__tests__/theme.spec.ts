import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useThemeStore } from '../theme'

const root = document.documentElement

describe('useThemeStore', () => {
  beforeEach(() => setActivePinia(createPinia()))

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    delete root.dataset.theme
  })

  it('sem escolha, deixa o CSS seguir o sistema', () => {
    expect(useThemeStore().theme).toBe('system')
    expect(root.dataset.theme).toBeUndefined()
  })

  it('guarda a escolha e a põe na raiz; voltar ao sistema apaga as duas', () => {
    const theme = useThemeStore()

    theme.choose('dark')
    expect(root.dataset.theme).toBe('dark')
    expect(localStorage.getItem('game-log:theme')).toBe('dark')

    theme.choose('system')
    expect(root.dataset.theme).toBeUndefined()
    expect(localStorage.getItem('game-log:theme')).toBeNull()
  })

  it('volta com a escolha guardada', () => {
    localStorage.setItem('game-log:theme', 'light')

    expect(useThemeStore().theme).toBe('light')
    expect(root.dataset.theme).toBe('light')
  })

  it('sem armazenamento, a escolha vale até recarregar', () => {
    const blocked = () => {
      throw new DOMException('Armazenamento bloqueado', 'SecurityError')
    }
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked)
    const theme = useThemeStore()

    theme.choose('dark')

    expect(theme.theme).toBe('dark')
    expect(root.dataset.theme).toBe('dark')
  })
})
