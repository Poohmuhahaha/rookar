import { db } from '../db'
import type { MacroIndicatorKey, MacroIndicatorValue, SectorBenchmark } from '../../src/types'

const IMF_BASE = 'https://www.imf.org/external/datamapper/api/v1'
const WORLD_BANK_BASE = 'https://api.worldbank.org/v2/country/THA/indicator'
const NSO_UNEMPLOYMENT_URL = 'https://catalogapi.nso.go.th/api/index?table=OS_02_0020_01&format=csv'
const CACHE_KEY = 'macro-tha-v3'
const TTL = 6 * 60 * 60 * 1000
const REQUEST_TIMEOUT_MS = 15_000

const indicatorOrder: MacroIndicatorKey[] = [
  'gdpGrowth',
  'householdConsumptionGrowth',
  'cpiInflation',
  'unemploymentRate',
  'governmentDebt',
  'currentAccountBalance',
]

type FetchResult = {
  indicators: Partial<Record<MacroIndicatorKey, MacroIndicatorValue>>
  missing: MacroIndicatorKey[]
  lastUpdated: string
}

export function toThaiYear(year: string): string {
  const parsed = Number(year)
  return Number.isFinite(parsed) && parsed > 0 ? String(parsed + 543) : year
}

function round1(value: number) {
  return Math.round(value * 10) / 10
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchWithRetry(url: string, init: RequestInit = {}, attempts = 2): Promise<Response> {
  let lastError: unknown = null
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fetchWithTimeout(url, init)
    } catch (error) {
      lastError = error
      if (attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`ดึงข้อมูลไม่สำเร็จ: ${url}`)
}

type ImfResponse = {
  values?: Record<string, Record<string, Record<string, number>>>
}

async function fetchImfIndicator(code: string): Promise<MacroIndicatorValue> {
  const response = await fetchWithRetry(`${IMF_BASE}/${code}/THA`, {
    headers: { Accept: 'application/json' },
  }, 1)
  if (!response.ok) throw new Error(`IMF ${code} ตอบกลับสถานะ ${response.status}`)

  const payload = await response.json() as ImfResponse
  const series = payload.values?.[code]?.THA
  if (!series) throw new Error(`IMF ไม่พบข้อมูล ${code} สำหรับประเทศไทย`)

  const currentYear = new Date().getFullYear()
  const entries = Object.entries(series)
    .map(([year, value]) => ({ year: Number(year), value: Number(value) }))
    .filter((entry) => Number.isFinite(entry.year) && Number.isFinite(entry.value))
    .sort((a, b) => a.year - b.year)

  if (entries.length === 0) throw new Error(`IMF ไม่มีค่าข้อมูล ${code}`)

  const eligible = entries.filter((entry) => entry.year <= currentYear)
  const latest = eligible.length > 0 ? eligible[eligible.length - 1] : entries[entries.length - 1]

  return {
    value: round1(latest.value),
    year: String(latest.year),
    source: 'IMF',
    periodLabel: `ปี ${toThaiYear(String(latest.year))}`,
    projected: latest.year >= currentYear,
  }
}

async function fetchWorldBankIndicator(code: string): Promise<MacroIndicatorValue> {
  const currentYear = new Date().getFullYear()
  const response = await fetchWithRetry(
    `${WORLD_BANK_BASE}/${code}?format=json&per_page=60&date=2015:${currentYear}`,
    { headers: { Accept: 'application/json' } },
  )
  if (!response.ok) throw new Error(`World Bank ${code} ตอบกลับสถานะ ${response.status}`)

  const payload = await response.json() as [
    { lastupdated?: string },
    { date: string; value: number | null }[],
  ]
  if (!Array.isArray(payload) || !Array.isArray(payload[1])) {
    throw new Error('รูปแบบข้อมูลจาก World Bank ไม่ถูกต้อง')
  }

  const row = payload[1].find(
    (item) => typeof item.value === 'number' && Number.isFinite(item.value),
  )
  if (!row || typeof row.value !== 'number') {
    throw new Error(`ไม่พบข้อมูล World Bank สำหรับ indicator ${code}`)
  }

  return {
    value: round1(row.value),
    year: row.date,
    source: 'World Bank',
    periodLabel: `ปี ${toThaiYear(row.date)}`,
    projected: false,
  }
}

function parseCsvLine(line: string): string[] {
  const values: string[] = []
  let value = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        value += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      values.push(value.trim())
      value = ''
    } else {
      value += char
    }
  }

  values.push(value.trim())
  return values
}

async function fetchNsoUnemployment(): Promise<MacroIndicatorValue> {
  const response = await fetchWithTimeout(NSO_UNEMPLOYMENT_URL, {
    headers: {
      Accept: 'text/csv',
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36',
    },
  }, 8_000)
  if (!response.ok) throw new Error(`NSO ตอบกลับสถานะ ${response.status}`)

  const text = await response.text()
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim())
  if (lines.length < 2) throw new Error('ข้อมูล NSO ว่างเปล่า')

  const header = parseCsvLine(lines[0]).map((cell) => cell.replace(/^\uFEFF/, ''))
  const indexes = {
    year: header.indexOf('year'),
    quarter: header.indexOf('quarter'),
    region: header.indexOf('region'),
    area: header.indexOf('area'),
    sex: header.indexOf('sex'),
    ageGroup: header.indexOf('age_group'),
    value: header.indexOf('value'),
  }
  if (Object.values(indexes).some((index) => index < 0)) {
    throw new Error('รูปแบบ CSV จาก NSO ไม่ถูกต้อง')
  }

  let latest: { thaiYear: number; quarter: number; value: number } | null = null
  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line)
    if (
      cells[indexes.region] !== 'ทั่วราชอาณาจักร'
      || cells[indexes.area] !== 'รวม'
      || cells[indexes.sex] !== 'รวม'
      || cells[indexes.ageGroup] !== 'รวม'
    ) {
      continue
    }

    const thaiYear = Number(cells[indexes.year])
    const quarter = Number(cells[indexes.quarter].replace(/[^\d]/g, ''))
    const value = Number(cells[indexes.value])
    if (!Number.isFinite(thaiYear) || !Number.isFinite(quarter) || !Number.isFinite(value)) {
      continue
    }

    if (
      !latest
      || thaiYear * 10 + quarter > latest.thaiYear * 10 + latest.quarter
    ) {
      latest = { thaiYear, quarter, value }
    }
  }

  if (!latest) throw new Error('NSO ไม่พบข้อมูลอัตราการว่างงานระดับประเทศ')

  const gregorianYear = latest.thaiYear - 543
  return {
    value: Math.round(latest.value * 100) / 100,
    year: String(gregorianYear),
    source: 'NSO',
    periodLabel: `ไตรมาส ${latest.quarter}/${latest.thaiYear}`,
    projected: false,
  }
}

async function fetchMacro(): Promise<FetchResult> {
  const imfWithFallback = async (imfCode: string, worldBankCode: string): Promise<MacroIndicatorValue> => {
    try {
      return await fetchImfIndicator(imfCode)
    } catch (error) {
      console.warn(`[macro] IMF ${imfCode} failed, falling back to World Bank ${worldBankCode}:`, error)
      return fetchWorldBankIndicator(worldBankCode)
    }
  }

  const jobs: Record<MacroIndicatorKey, () => Promise<MacroIndicatorValue>> = {
    gdpGrowth: () => imfWithFallback('NGDP_RPCH', 'NY.GDP.MKTP.KD.ZG'),
    householdConsumptionGrowth: () => fetchWorldBankIndicator('NE.CON.PRVT.KD.ZG'),
    cpiInflation: () => imfWithFallback('PCPIPCH', 'FP.CPI.TOTL.ZG'),
    unemploymentRate: async () => {
      try {
        return await fetchNsoUnemployment()
      } catch (error) {
        console.error('[macro] NSO unemployment failed, falling back to IMF:', error)
        try {
          return await fetchImfIndicator('LUR')
        } catch (imfError) {
          console.error('[macro] IMF unemployment failed, falling back to World Bank:', imfError)
          return fetchWorldBankIndicator('SL.UEM.TOTL.ZS')
        }
      }
    },
    governmentDebt: () => imfWithFallback('d', 'GC.DOD.TOTL.GD.ZS'),
    currentAccountBalance: () =>
      imfWithFallback('BCA_NGDPD', 'BN.CAB.XOKA.GD.ZS'),
  }

  const settled = await Promise.allSettled(indicatorOrder.map((key) => jobs[key]()))
  const indicators: Partial<Record<MacroIndicatorKey, MacroIndicatorValue>> = {}
  const missing: MacroIndicatorKey[] = []

  settled.forEach((result, index) => {
    const key = indicatorOrder[index]
    if (result.status === 'fulfilled') {
      indicators[key] = result.value
      return
    }
    missing.push(key)
    console.error(`[macro] ${key} failed:`, result.reason)
  })

  return {
    indicators,
    missing,
    lastUpdated: new Date().toISOString(),
  }
}

async function readCache(allowStale: boolean): Promise<SectorBenchmark | null> {
  const row = await db.query<{ payload_json: string; saved_at: number }>('SELECT payload_json, saved_at FROM macro_cache WHERE cache_key = ?').get(CACHE_KEY)
  if (!row) return null
  if (!allowStale && Date.now() - row.saved_at > TTL) return null
  try {
    return JSON.parse(row.payload_json) as SectorBenchmark
  } catch {
    return null
  }
}

async function writeCache(data: SectorBenchmark) {
  await db.query(
    'INSERT INTO macro_cache (cache_key, payload_json, saved_at) VALUES (?, ?, ?) ON CONFLICT(cache_key) DO UPDATE SET payload_json = excluded.payload_json, saved_at = excluded.saved_at',
  ).run(CACHE_KEY, JSON.stringify(data), Date.now())
}

export async function getMacroBenchmark(options: { force?: boolean } = {}): Promise<SectorBenchmark> {
  if (!options.force) {
    const fresh = await readCache(false)
    if (fresh) return fresh
  }

  const stale = await readCache(true)

  try {
    const fetched = await fetchMacro()
    const indicators = {} as Record<MacroIndicatorKey, MacroIndicatorValue>
    const missing: MacroIndicatorKey[] = []

    for (const key of indicatorOrder) {
      const value = fetched.indicators[key] ?? stale?.indicators[key]
      if (value) indicators[key] = value
      else missing.push(key)
    }

    if (missing.length > 0) {
      throw new Error(`ไม่สามารถดึงข้อมูลเศรษฐกิจได้: ${missing.join(', ')}`)
    }

    const usedSources = new Set(Object.values(indicators).map((item) => item.source).filter(Boolean))
    const sourceParts: string[] = []
    if (usedSources.has('IMF')) sourceParts.push('IMF WEO')
    if (usedSources.has('World Bank')) sourceParts.push('World Bank')
    if (usedSources.has('NSO')) sourceParts.push('NSO')
    const sourceLabel = sourceParts.join(', ')

    const sourceUrl = usedSources.has('World Bank')
      ? 'https://data.worldbank.org/country/THA'
      : usedSources.has('IMF')
        ? 'https://www.imf.org/external/datamapper/'
        : 'https://catalogapi.nso.go.th/'

    const data: SectorBenchmark = {
      countryName: 'ประเทศไทย',
      periodLabel: `ข้อมูลล่าสุดจาก ${sourceLabel}`,
      indicators,
      source: sourceLabel,
      sourceUrl,
      lastUpdated: fetched.lastUpdated,
      fetchedAt: new Date().toISOString(),
      stale: fetched.missing.length > 0,
    }

    await writeCache(data)
    return data
  } catch (error) {
    if (stale) return { ...stale, stale: true }
    throw error
  }
}
