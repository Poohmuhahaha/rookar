import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearSession, getSession } from '@/lib/session'
import {
  commitImport,
  createImportPreview,
  getDashboard,
  listSources,
  login,
  validateImport,
} from '@/lib/mockApi'
import type { DataSource, ImportPreview, Session } from '@/types'

const session: Session = {
  user: { id: 'u1', name: 'Demo', email: 'demo@rookar.co', role: 'owner', initials: 'DE', avatarUrl: '/avatar.jpg' },
  business: { name: 'Demo Co', type: 'fnb', typeLabel: 'F&B', employees: '1-10', revenueRange: '1-3 ล้านบาท', goals: [] },
  onboardingComplete: true,
  plan: 'Pro',
  createdAt: '2026-11-01T00:00:00.000Z',
}

const preview: ImportPreview = {
  previewId: 'preview_1',
  fileName: 'sales.csv',
  fileSize: 100,
  totalRows: 2,
  validRows: 2,
  duplicateRows: 0,
  errorRows: 0,
  columns: ['วันที่', 'ยอดขาย'],
  rows: [],
  errors: [],
  type: 'sales',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

function mockFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => handler(String(input), init))
  vi.stubGlobal('fetch', fn)
  return fn
}

beforeEach(() => {
  clearSession()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('API client', () => {
  it('logs in and stores the session', async () => {
    const fetchMock = mockFetch((url) => {
      expect(url).toBe('/api/auth/login')
      return json({ session })
    })

    const result = await login('demo@rookar.co', 'rookar1234')

    expect(result.user.email).toBe('demo@rookar.co')
    expect(getSession()?.user.id).toBe('u1')
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('surfaces API error messages', async () => {
    mockFetch(() => json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, 401))

    await expect(login('demo@rookar.co', 'wrongpass')).rejects.toThrow('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
    expect(getSession()).toBeNull()
  })

  it('loads sources and dashboard from the API', async () => {
    const sources: DataSource[] = [{
      id: 'ds1', name: 'Sales', type: 'sales', typeLabel: 'ยอดขาย', rowCount: 10,
      quality: 'complete', updatedAt: '2026-11-01T00:00:00.000Z', period: 'พ.ย. 2569', fileName: 'sales.csv',
    }]
    mockFetch((url) => {
      if (url === '/api/sources') return json({ sources })
      if (url.startsWith('/api/dashboard?')) return json({ dashboard: { rangeLabel: '6 เดือนล่าสุด' } })
      return json({ error: 'not found' }, 404)
    })

    expect(await listSources()).toHaveLength(1)
    const dashboard = await getDashboard('6m', 'fnb')
    expect(dashboard?.rangeLabel).toBe('6 เดือนล่าสุด')
  })

  it('sends import preview, validate and commit requests', async () => {
    const fetchMock = mockFetch((url) => {
      if (url === '/api/imports/preview') return json({ preview })
      if (url === '/api/imports/preview_1/validate') return json({ preview: { ...preview, validRows: 1, errorRows: 1 } })
      if (url === '/api/imports/preview_1/commit') return json({ source: { id: 'ds_new' } })
      return json({ error: 'not found' }, 404)
    })

    const file = new File(['วันที่,ยอดขาย\n2026-11-01,100'], 'sales.csv', { type: 'text/csv' })
    const created = await createImportPreview(file, 'sales')
    expect(created.previewId).toBe('preview_1')
    const validated = await validateImport(created.previewId!, { date: 'วันที่', amount: 'ยอดขาย' })
    expect(validated.errorRows).toBe(1)
    const source = await commitImport(validated, { date: 'วันที่', amount: 'ยอดขาย' })
    expect(source.id).toBe('ds_new')
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
})
