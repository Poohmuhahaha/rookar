import { afterEach, describe, expect, it, vi } from 'vitest'
import { getMacroBenchmark, toThaiYear } from '@/lib/macroApi'

const benchmark = {
  countryName: 'ประเทศไทย',
  periodLabel: 'ข้อมูลรายปี ล่าสุด ปี 2568',
  indicators: {
    gdpGrowth: { value: 2.4, year: '2025' },
    householdConsumptionGrowth: { value: 2.7, year: '2025' },
    cpiInflation: { value: -0.1, year: '2025' },
    unemploymentRate: { value: 0.8, year: '2025' },
  },
  source: 'World Bank Open Data',
  sourceUrl: 'https://data.worldbank.org/country/thailand',
  lastUpdated: '2026-10-08',
  fetchedAt: '2026-11-01T00:00:00.000Z',
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('macro API client', () => {
  it('loads the benchmark from the backend', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ benchmark }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await getMacroBenchmark()

    expect(fetchMock).toHaveBeenCalledWith('/api/macro', expect.objectContaining({ credentials: 'include' }))
    expect(result.indicators.gdpGrowth.value).toBe(2.4)
  })

  it('passes the force flag', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ benchmark }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await getMacroBenchmark({ force: true })

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('/api/macro?force=1')
  })

  it('converts Buddhist years', () => {
    expect(toThaiYear('2025')).toBe('2568')
    expect(toThaiYear('unknown')).toBe('unknown')
  })
})
