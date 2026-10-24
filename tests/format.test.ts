import { describe, expect, it } from 'vitest'
import {
  formatCurrency,
  formatDelta,
  formatFileSize,
  formatNumber,
  initialsFromName,
} from '@/lib/format'

describe('format helpers', () => {
  it('formats Thai numbers and currency', () => {
    expect(formatNumber(6248500)).toBe('6,248,500')
    expect(formatCurrency(6248500)).toContain('6,248,500')
  })

  it('keeps signed deltas readable', () => {
    expect(formatDelta(12.4)).toBe('+12.4%')
    expect(formatDelta(-2)).toBe('-2%')
    expect(formatDelta(0)).toBe('0%')
  })

  it('formats file sizes', () => {
    expect(formatFileSize(900)).toBe('900 B')
    expect(formatFileSize(1536)).toBe('2 KB')
    expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB')
  })

  it('builds initials from Thai names', () => {
    expect(initialsFromName('ภีม ธีรภัทร')).toBe('ภธ')
    expect(initialsFromName('สมชาย')).toBe('สม')
    expect(initialsFromName('   ')).toBe('R')
  })
})
