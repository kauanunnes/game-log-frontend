const longDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'UTC' })

/** "2017-02-24" → "24 de fevereiro de 2017". A data vem sem fuso; em UTC ela não volta um dia. */
export const formatDate = (isoDate: string) => longDate.format(new Date(isoDate))

export const formatNumber = (value: number) => value.toLocaleString('pt-BR')

/** "83.98" em BRL → "R$ 83,98". */
export const formatMoney = (amount: string, currency: string) =>
  Number(amount).toLocaleString('pt-BR', { style: 'currency', currency })

const CURRENCIES = ['BRL', 'USD', 'EUR', 'GBP', 'JPY', 'ARS']

/** Moedas dos formulários; uma moeda salva fora da lista entra também. */
export const currencyOptions = (current?: string) =>
  current && !CURRENCIES.includes(current) ? [current, ...CURRENCIES] : CURRENCIES

const relative = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 86_400],
  ['month', 30 * 86_400],
  ['week', 7 * 86_400],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
]

/** "há 5 minutos", "ontem", "há 3 semanas"; menos de um minuto é "agora". */
export function formatRelative(isoInstant: string, now = Date.now()) {
  const seconds = (new Date(isoInstant).getTime() - now) / 1000
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit)
  }
  return 'agora'
}
