import type { IndustryEconomics, SectorBenchmark } from '@/types'
import { apiFetch } from './api/client'

export function toThaiYear(year: string): string {
  const parsed = Number(year)
  return Number.isFinite(parsed) && parsed > 0 ? String(parsed + 543) : year
}

export async function getMacroBenchmark(options: { force?: boolean } = {}): Promise<SectorBenchmark> {
  const query = options.force ? '?force=1' : ''
  const data = await apiFetch<{ benchmark: SectorBenchmark }>(`/macro${query}`)
  return data.benchmark
}

export function clearMacroCache() {
  // Cache lives on the server; no-op on the client.
}

export async function getIndustryEconomics(industry?: string | null): Promise<IndustryEconomics> {
  const query = industry ? `?industry=${encodeURIComponent(industry)}` : ''
  const data = await apiFetch<{ economics: IndustryEconomics }>(`/macro/industry${query}`)
  return data.economics
}
