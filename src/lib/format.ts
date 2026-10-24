import { format, formatDistanceToNowStrict, parseISO } from 'date-fns'
import { th } from 'date-fns/locale'

const numberFormatter = new Intl.NumberFormat('th-TH')
const compactFormatter = new Intl.NumberFormat('th-TH', {
  notation: 'compact',
  maximumFractionDigits: 1,
})
const currencyFormatter = new Intl.NumberFormat('th-TH', {
  style: 'currency',
  currency: 'THB',
  maximumFractionDigits: 0,
})
const percentFormatter = new Intl.NumberFormat('th-TH', {
  maximumFractionDigits: 1,
})

export function formatNumber(value: number): string {
  return numberFormatter.format(value)
}

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

export function formatCompact(value: number): string {
  return compactFormatter.format(value)
}

export function formatPercent(value: number): string {
  return `${percentFormatter.format(value)}%`
}

export function formatDelta(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${percentFormatter.format(value)}%`
}

export function formatDateThai(value: string | Date): string {
  const date = typeof value === 'string' ? parseISO(value) : value
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatDateTimeThai(value: string | Date): string {
  const date = typeof value === 'string' ? parseISO(value) : value
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatTime(value: string | Date): string {
  const date = typeof value === 'string' ? parseISO(value) : value
  return format(date, 'HH:mm')
}

export function timeAgo(value: string | Date): string {
  const date = typeof value === 'string' ? parseISO(value) : value
  return formatDistanceToNowStrict(date, { addSuffix: true, locale: th })
}

export function shortTimeAgo(value: string | Date): string {
  const date = typeof value === 'string' ? parseISO(value) : value
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000))
  if (minutes < 1) return 'เมื่อสักครู่'
  if (minutes < 60) return `${minutes} นาที`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ชม.`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} วัน`
  return format(date, 'd MMM', { locale: th })
}

export function monthLabel(date: Date): string {
  return format(date, 'MMM', { locale: th })
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'R'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}
