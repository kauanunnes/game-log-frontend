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
