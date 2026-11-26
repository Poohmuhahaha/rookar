import { beforeAll, describe, expect, it } from 'bun:test'

process.env.DATABASE_URL = ':memory:'
process.env.NODE_ENV = 'test'
process.env.AI_PROVIDER = 'mock'
process.env.OPENAI_API_KEY = ''
process.env.MEDIA_DIR = `/tmp/rookar-media-test-${process.pid}`

const { initBunRuntime } = await import('./bunDb')
initBunRuntime({ databaseUrl: ':memory:', nodeEnv: 'test', aiProvider: 'mock', openaiApiKey: '', allowDevReset: true })
const { app } = await import('./app')
const { normalizeIndustryId } = await import('../src/lib/industries')
const { parseCsv } = await import('./services/imports')

let cookie = ''
let userId = ''

function jsonRequest(path: string, body: unknown, method = 'POST') {
  return app.request(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Origin: 'http://localhost:5173',
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(body),
  })
}

async function importCsv(
  importCookie: string,
  fileName: string,
  csv: string,
  type: string,
  mapping: Record<string, string>,
  industryId?: string,
) {
  const form = new FormData()
  form.set('file', new File([csv], fileName, { type: 'text/csv' }))
  form.set('type', type)
  const previewResponse = await app.request('/api/imports/preview', {
    method: 'POST',
    headers: { Cookie: importCookie, Origin: 'http://localhost:5173' },
    body: form,
  })
  const preview = (await previewResponse.json() as { preview: { previewId: string } }).preview
  const validate = await app.request(`/api/imports/${preview.previewId}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: importCookie, Origin: 'http://localhost:5173' },
    body: JSON.stringify({ mapping }),
  })
  expect(validate.status).toBe(200)
  const commit = await app.request(`/api/imports/${preview.previewId}/commit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: importCookie, Origin: 'http://localhost:5173' },
    body: JSON.stringify({ mapping, industryId }),
  })
  expect(commit.status).toBe(200)
  return commit
}

const TEST_EMAIL = 'test@rookar.co'
const TEST_PASSWORD = 'testpassword123'

beforeAll(async () => {
  const signup = await app.request('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' },
    body: JSON.stringify({ name: 'Test User', username: 'testuser', email: TEST_EMAIL, password: TEST_PASSWORD }),
  })
  const setCookie = signup.headers.get('set-cookie') ?? ''
  cookie = setCookie.split(';')[0] ?? ''
  const data = await signup.json() as { session: { user: { id: string } } }
  userId = data.session.user.id
})

describe('ROOKAR API', () => {
  it('health and session', async () => {
    expect((await app.request('/api/health')).status).toBe(200)
    const response = await app.request('/api/auth/session', { headers: { Cookie: cookie } })
    const data = await response.json() as { session: { user: { email: string } } }
    expect(data.session.user.email).toBe(TEST_EMAIL)
  })

  it('starts with an empty workspace', async () => {
    const sourcesResponse = await app.request('/api/sources', { headers: { Cookie: cookie } })
    const sources = await sourcesResponse.json() as { sources: unknown[] }
    expect(sources.sources).toHaveLength(0)

    const dashboardResponse = await app.request('/api/dashboard?range=6m&industry=fnb', { headers: { Cookie: cookie } })
    const dashboard = await dashboardResponse.json() as { dashboard: unknown }
    expect(dashboard.dashboard).toBeNull()
  })

  it('uploads an avatar to the media store and sets it on the session', async () => {
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z2Z8AAAAASUVORK5CYII='
    const png = Uint8Array.from(atob(pngBase64), (char) => char.charCodeAt(0))
    const form = new FormData()
    form.set('file', new File([png], 'avatar.png', { type: 'image/png' }))
    form.set('kind', 'avatar')

    const upload = await app.request('/api/media', {
      method: 'POST',
      headers: { Cookie: cookie, Origin: 'http://localhost:5173' },
      body: form,
    })
    expect(upload.status).toBe(201)
    const uploaded = await upload.json() as { media: { id: string; url: string } }
    expect(uploaded.media.url).toBe(`/api/media/${uploaded.media.id}`)

    const update = await jsonRequest('/api/me', { avatarMediaId: uploaded.media.id }, 'PATCH')
    expect(update.status).toBe(200)
    const session = await update.json() as { session: { user: { avatarUrl: string } } }
    expect(session.session.user.avatarUrl).toBe(`/api/media/${uploaded.media.id}`)

    const served = await app.request(`/api/media/${uploaded.media.id}`, {
      headers: { Cookie: cookie },
    })
    expect(served.status).toBe(200)
    expect(served.headers.get('content-type')).toBe('image/png')
    expect(served.headers.get('cache-control')).toContain('private')
  })

  it('imports real CSV data scoped by industry', async () => {
    const signup = await app.request('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' },
      body: JSON.stringify({ name: 'Import User', username: 'importuser', email: 'import@example.com', password: 'rookar1234' }),
    })
    const importCookie = (signup.headers.get('set-cookie') ?? '').split(';')[0] ?? ''
    const business = await app.request('/api/business', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: importCookie, Origin: 'http://localhost:5173' },
      body: JSON.stringify({
        name: 'Import Cafe',
        type: 'fnb',
        typeLabel: 'อาหารและเครื่องดื่ม',
        employees: '1-5',
        revenueRange: '1-3 ล้าน',
        goals: ['เพิ่มยอดขาย'],
      }),
    })
    expect(business.status).toBe(200)

    await importCsv(
      importCookie,
      'sales.csv',
      'วันที่,ยอดขาย,ช่องทางขาย\n2026-11-01,1000,Store\n2026-11-02,2000,Grab\n',
      'sales',
      { date: 'วันที่', amount: 'ยอดขาย', channel: 'ช่องทางขาย' },
    )
    await importCsv(
      importCookie,
      'expenses.csv',
      'วันที่,หมวดหมู่,จำนวนเงิน\n2026-11-02,ค่าวัตถุดิบกาแฟ,500\n',
      'expenses',
      { date: 'วันที่', category: 'หมวดหมู่', amount: 'จำนวนเงิน' },
    )

    const sources = await app.request('/api/sources', { headers: { Cookie: importCookie } })
    const list = await sources.json() as { sources: { fileName: string; industryId?: string }[] }
    expect(list.sources.some((source) => source.fileName === 'sales.csv')).toBe(true)
    expect(list.sources.every((source) => source.industryId === 'fnb')).toBe(true)

    const dashboard = await app.request('/api/dashboard?range=6m&industry=fnb', { headers: { Cookie: importCookie } })
    const data = await dashboard.json() as {
      dashboard: {
        revenue: number
        cost: number
        profit: number
        industry: { id: string; realSourceCount: number }
        segments: { label: string; share: number }[]
      }
    }
    expect(data.dashboard.revenue).toBe(3000)
    expect(data.dashboard.cost).toBe(500)
    expect(data.dashboard.profit).toBe(2500)
    expect(data.dashboard.industry.id).toBe('fnb')
    expect(data.dashboard.industry.realSourceCount).toBe(2)
    expect(data.dashboard.segments.length).toBeGreaterThan(0)

    const otherIndustry = await app.request('/api/dashboard?range=6m&industry=healthcare', { headers: { Cookie: importCookie } })
    const other = await otherIndustry.json() as { dashboard: unknown }
    expect(other.dashboard).toBeNull()

    const override = await importCsv(
      importCookie,
      'route_sales.csv',
      'วันที่,ยอดขาย\n2026-11-03,700\n',
      'sales',
      { date: 'วันที่', amount: 'ยอดขาย' },
      'logistics',
    )
    const overrideSource = (await override.json() as { source: { industryId?: string } }).source
    expect(overrideSource.industryId).toBe('logistics')

    const allResponse = await app.request('/api/dashboard?range=6m&industry=all', { headers: { Cookie: importCookie } })
    const all = await allResponse.json() as {
      dashboard: { revenue: number; cost: number; industry: { id: string }; costSegments: unknown[] }
    }
    expect(all.dashboard.industry.id).toBe('all')
    expect(all.dashboard.revenue).toBe(3700)
    expect(all.dashboard.cost).toBe(500)
    expect(all.dashboard.costSegments.length).toBeGreaterThan(0)
  })

  it('syncs conversations and agents', async () => {
    const conversations = await app.request('/api/conversations', { headers: { Cookie: cookie } })
    const seeded = await conversations.json() as { conversations: unknown[] }
    expect(seeded.conversations.length).toBeGreaterThan(0)
    const put = await jsonRequest('/api/conversations', { conversations: seeded.conversations }, 'PUT')
    expect(put.status).toBe(200)

    const agents = await jsonRequest('/api/agents', { agents: [{ id: 'a1', name: 'Test' }] }, 'PUT')
    expect(agents.status).toBe(200)
    const list = await app.request('/api/agents', { headers: { Cookie: cookie } })
    const data = await list.json() as { agents: { id: string }[] }
    expect(data.agents[0]?.id).toBe('a1')
  })

  it('streams a grounded AI answer', async () => {
    const response = await jsonRequest('/api/chat/stream', { question: 'สรุปกำไรให้หน่อย', industry: 'fnb' })
    expect(response.status).toBe(200)
    const text = await response.text()
    expect(text).toContain('"type":"token"')
    expect(text).toContain('"type":"done"')
  })

  it('accepts specialist, agent, history and attachment context in chat', async () => {
    const agents = [{
      id: 'agent_cfo',
      name: 'CFO Agent',
      role: 'การเงิน',
      systemPrompt: 'โฟกัสต้นทุนและกระแสเงินสด',
      enabled: true,
      color: '#000000',
      personality: 'analytical',
      personalityLabel: 'วิเคราะห์',
      description: 'test',
      category: 'finance',
      categoryLabel: 'การเงิน',
      creator: { name: 'Test' },
    }]
    expect((await jsonRequest('/api/agents', { agents }, 'PUT')).status).toBe(200)

    const response = await jsonRequest('/api/chat/stream', {
      question: 'ช่วยวิเคราะห์ไฟล์นี้ต่อจากบทสนทนาก่อนหน้า',
      industry: 'fnb',
      specialistRole: 'finance',
      agentIds: ['agent_cfo'],
      history: [
        { role: 'user', content: 'ต้นทุนหลักคืออะไร' },
        { role: 'assistant', content: 'ต้นทุนหลักคือวัตถุดิบ' },
      ],
      attachment: { name: 'costs.csv', content: 'วันที่,amount\n2026-11-01,1200' },
    })
    expect(response.status).toBe(200)
    const text = await response.text()
    expect(text).toContain('"type":"token"')
    expect(text).toContain('"type":"done"')
  })

  it('blocks cross-origin auth requests and non-JSON bodies', async () => {
    const crossOrigin = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    })
    expect(crossOrigin.status).toBe(403)

    const plainText = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain', Origin: 'http://localhost:5173' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    })
    expect(plainText.status).toBe(415)
  })

  it('rejects prototype-chain industry values and parses quoted CSV rows', () => {
    expect(normalizeIndustryId('toString')).toBe('fnb')
    expect(normalizeIndustryId('__proto__')).toBe('fnb')

    const parsed = parseCsv('date,note,amount\n2026-11-01,"hello, world",100\n2026-11-02,"line one\nline two",200\n')
    expect(parsed.rows[0].note).toBe('hello, world')
    expect(parsed.rows[1].note).toBe('line one\nline two')
  })

  it('resets a password through a one-time token', async () => {
    const email = 'reset@example.com'
    const signup = await app.request('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' },
      body: JSON.stringify({ name: 'Reset User', username: 'resetuser', email, password: 'oldpassword123' }),
    })
    expect(signup.status).toBe(200)

    const forgot = await app.request('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' },
      body: JSON.stringify({ email }),
    })
    expect(forgot.status).toBe(200)
    const forgotData = await forgot.json() as { devResetUrl?: string }
    expect(forgotData.devResetUrl).toBeTruthy()
    const resetToken = new URL(forgotData.devResetUrl!).searchParams.get('token')
    expect(resetToken).toBeTruthy()

    const reset = await app.request('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' },
      body: JSON.stringify({ token: resetToken, password: 'newpassword123' }),
    })
    expect(reset.status).toBe(200)

    const reused = await app.request('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' },
      body: JSON.stringify({ token: resetToken, password: 'anotherpassword123' }),
    })
    expect(reused.status).toBe(400)

    const login = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' },
      body: JSON.stringify({ email, password: 'newpassword123' }),
    })
    expect(login.status).toBe(200)
  })
})
