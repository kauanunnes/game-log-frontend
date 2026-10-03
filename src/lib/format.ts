const longDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'UTC' })

/** "2017-02-24" → "24 de fevereiro de 2017". A data vem sem fuso; em UTC ela não volta um dia. */
export const formatDate = (isoDate: string) => longDate.format(new Date(isoDate))

export const formatNumber = (value: number) => value.toLocaleString('pt-BR')
