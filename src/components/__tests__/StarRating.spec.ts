import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import StarRating from '../StarRating.vue'

describe('StarRating', () => {
  it('preenche as estrelas em quartos', () => {
    const wrapper = mount(StarRating, { props: { modelValue: 4.75, readonly: true } })

    expect(wrapper.findAll('.fill').map((fill) => fill.attributes('style'))).toEqual([
      'width: 100%;',
      'width: 100%;',
      'width: 100%;',
      'width: 100%;',
      'width: 75%;',
    ])
    expect(wrapper.attributes('aria-label')).toBe('Nota: 4,75 de 5')
  })

  it('ajusta a nota pelo teclado sem sair de 0 a 5', async () => {
    const wrapper = mount(StarRating, {
      props: {
        modelValue: 4.75,
        'onUpdate:modelValue': (value: number | null) => wrapper.setProps({ modelValue: value }),
      },
    })
    const seen: (number | null | undefined)[] = []

    for (const key of ['ArrowRight', 'ArrowRight', 'ArrowLeft', 'Home', 'ArrowLeft', 'Delete']) {
      await wrapper.trigger('keydown', { key })
      seen.push(wrapper.props('modelValue'))
    }

    expect(seen).toEqual([5, 5, 4.75, 0, 0, null])
  })

  it('não muda quando é somente leitura', async () => {
    const wrapper = mount(StarRating, { props: { modelValue: 3, readonly: true } })

    await wrapper.trigger('keydown', { key: 'ArrowRight' })

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.attributes('role')).toBe('img')
  })
})
