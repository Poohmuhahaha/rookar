import { db } from '../db'
import type { MacroIndicatorKey, MacroIndicatorValue, SectorBenchmark } from '../../src/types'

const BASE = 'https://api.worldbank.org/v2/country/THA/indicator'
const CACHE_KEY = 'world-bank-tha'
const TTL = 6 * 60 * 60 * 1000
const indicators: Record<MacroIndicatorKey, string> = {
  gdpGrowth: 'NY.GDP.MKTP.KD.ZG',
  householdConsumptionGrowth: 'NE.CON.PRVT.KD.ZG',
  cpiInflation: 'FP.CPI.TOTL.ZG',
  unemploymentRate: 'SL.UEM.TOTL.ZS',
}

export function toThaiYear(year: string): string {
  const parsed = Number(year)
  return Number.isFinite(parsed) && parsed > 0 ? String(parsed + 543) : year
}

function round1(value: number) {
  return Math.round(value * 10) / 10
}

async function fetchIndicator(id: string, signal: AbortSignal): Promise<{ value: MacroIndicatorValue; lastUpdated: string }> {
  const currentYear = new Date().getFullYear()
  const response = await fetch(`${BASE}/${id}?format=json&per_page=60&date=2015:${currentYear}`, {
    signal,
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) throw new Error(`World Bank API ตอบกลับสถานะ ${response.status}`)
  const payload = await response.json() as [{ lastupdated: string }, { date: string; value: number | null }[]]
  if (!Array.isArray(payload) || !Array.isArray(payload[1])) throw new Error('รูปแบบข้อมูลจาก World Bank ไม่ถูกต้อง')
  const row = payload[1].find((item) => typeof item.value === 'number' && Number.isFinite(item.value))
  if (!row || typeof row.value !== 'number') throw new Error(`ไม่พบข้อมูลสำหรับ indicator ${id}`)
  return { value: { value: round1(row.value), year: row.date }, lastUpdated: payload[0]?.lastupdated ?? '' }
}

async function fetchMacro(): Promise<SectorBenchmark> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12_000)
  try {
    const keys = Object.keys(indicators) as MacroIndicatorKey[]
    const results = await Promise.all(keys.map((key) => fetchIndicator(indicators[key], controller.signal)))
    const values = Object.fromEntries(keys.map((key, index) => [key, results[index].value])) as Record<MacroIndicatorKey, MacroIndicatorValue>
    const years = results.map((result) => Number(result.value.year)).filter(Number.isFinite)
    const latestYear = years.length ? String(Math.max(...years)) : ''
    const lastUpdated = results.map((result) => result.lastUpdated).filter(Boolean).sort().at(-1) ?? ''
    return {
      countryName: 'ประเทศไทย',
      periodLabel: latestYear ? `ข้อมูลรายปี ล่าสุด ปี ${toThaiYear(latestYear)}` : 'ข้อมูลรายปี',
      indicators: values,
      source: 'World Bank Open Data',
      sourceUrl: 'https://data.worldbank.org/country/thailand',
      lastUpdated: lastUpdated || new Date().toISOString(),
      fetchedAt: new Date().toISOString(),
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('หมดเวลารอข้อมูลจาก World Bank')
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

function readCache(allowStale: boolean): SectorBenchmark | null {
  const row = db.query('SELECT payload_json, saved_at FROM macro_cache WHERE cache_key = ?').get(CACHE_KEY) as { payload_json: string; saved_at: number } | null
  if (!row) return null
  if (!allowStale && Date.now() - row.saved_at > TTL) return null
  try {
    return JSON.parse(row.payload_json) as SectorBenchmark
  } catch {
    return null
  }
}

function writeCache(data: SectorBenchmark) {
  db.query(
    'INSERT INTO macro_cache (cache_key, payload_json, saved_at) VALUES (?, ?, ?) ON CONFLICT(cache_key) DO UPDATE SET payload_json = excluded.payload_json, saved_at = excluded.saved_at',
  ).run(CACHE_KEY, JSON.stringify(data), Date.now())
}

export async function getMacroBenchmark(options: { force?: boolean } = {}): Promise<SectorBenchmark> {
  if (!options.force) {
    const fresh = readCache(false)
    if (fresh) return fresh
  }
  const stale = readCache(true)
  try {
    const data = await fetchMacro()
    writeCache(data)
    return data
  } catch (error) {
    if (stale) return { ...stale, stale: true }
    throw error
  }
}
