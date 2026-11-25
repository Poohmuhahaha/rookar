export function formatMacroPeriod(
  periodLabel: string | undefined,
  year: string | undefined,
  lang: 'th' | 'en',
): string {
  if (lang !== 'en') {
    if (periodLabel) return periodLabel
    const parsed = Number(year)
    return Number.isFinite(parsed) && parsed > 0 ? `ปี ${parsed + 543}` : ''
  }

  const quarter = periodLabel?.match(/ไตรมาส\s*(\d+)\s*\/\s*(\d{4})/)
  if (quarter) return `Q${quarter[1]}/${Number(quarter[2]) - 543}`

  if (year) return `Year ${year}`

  const thaiYear = periodLabel?.match(/ปี\s*(\d{4})/)
  if (thaiYear) return `Year ${Number(thaiYear[1]) - 543}`

  return periodLabel ?? ''
}
