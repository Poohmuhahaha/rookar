import { beforeAll, describe, expect, it } from 'bun:test'

process.env.DATABASE_URL = ':memory:'
process.env.NODE_ENV = 'test'

const { app } = await import('./app')

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

const TEST_EMAIL = 'test@rookar.co'
const TEST_PASSWORD = 'testpassword123'

beforeAll(async () => {
  const signup = await app.request('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' },
    body: JSON.stringify({ name: 'Test User', email: TEST_EMAIL, password: TEST_PASSWORD }),
  })
  const setCookie = signup.headers.get('set-cookie') ?? ''
  cookie = setCookie.split(';')[0] ?? ''
  const data = await signup.json() as { session: { user: { id: string } } }
  userId = data.session.user.id
  await app.request('/api/sources/seed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie, Origin: 'http://localhost:5173' },
    body: JSON.stringify({ industry: 'fnb' }),
  })
})

describe('ROOKAR API', () => {
  it('health and session', async () => {
    expect((await app.request('/api/health')).status).toBe(200)
    const response = await app.request('/api/auth/session', { headers: { Cookie: cookie } })
    const data = await response.json() as { session: { user: { email: string } } }
    expect(data.session.user.email).toBe(TEST_EMAIL)
  })

  it('returns demo sources and dashboard', async () => {
    const sourcesResponse = await app.request('/api/sources', { headers: { Cookie: cookie } })
    const sources = await sourcesResponse.json() as { sources: unknown[] }
    expect(sources.sources).toHaveLength(4)

    const dashboardResponse = await app.request('/api/dashboard?range=6m&industry=fnb', { headers: { Cookie: cookie } })
    const dashboard = await dashboardResponse.json() as { dashboard: { revenue: number; series: unknown[] } }
    expect(dashboard.dashboard.revenue).toBe(6_248_500)
    expect(dashboard.dashboard.series).toHaveLength(6)
  })

  it('imports a CSV and updates the dashboard', async () => {
    const signup = await app.request('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' },
      body: JSON.stringify({ name: 'Import User', email: 'import@example.com', password: 'rookar1234' }),
    })
    const importCookie = (signup.headers.get('set-cookie') ?? '').split(';')[0] ?? ''
    const form = new FormData()
    form.set('file', new File(['วันที่,ยอดขาย\n2026-11-01,1000\n2026-11-02,2000\n'], 'sales.csv', { type: 'text/csv' }))
    form.set('type', 'sales')
    const previewResponse = await app.request('/api/imports/preview', {
      method: 'POST',
      headers: { Cookie: importCookie, Origin: 'http://localhost:5173' },
      body: form,
    })
    const preview = (await previewResponse.json() as { preview: { previewId: string } }).preview
    const mapping = { date: 'วันที่', amount: 'ยอดขาย' }
    const validate = await app.request(`/api/imports/${preview.previewId}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: importCookie, Origin: 'http://localhost:5173' },
      body: JSON.stringify({ mapping }),
    })
    expect(validate.status).toBe(200)
    const commit = await app.request(`/api/imports/${preview.previewId}/commit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: importCookie, Origin: 'http://localhost:5173' },
      body: JSON.stringify({ mapping }),
    })
    expect(commit.status).toBe(200)
    const sources = await app.request('/api/sources', { headers: { Cookie: importCookie } })
    const list = await sources.json() as { sources: { fileName: string }[] }
    expect(list.sources.some((source) => source.fileName === 'sales.csv')).toBe(true)
    const dashboard = await app.request('/api/dashboard?range=6m', { headers: { Cookie: importCookie } })
    const data = await dashboard.json() as { dashboard: { revenue: number } }
    expect(data.dashboard.revenue).toBe(6_248_500)
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

  it('resets a password through a one-time token', async () => {
    const email = 'reset@example.com'
    const signup = await app.request('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' },
      body: JSON.stringify({ name: 'Reset User', email, password: 'oldpassword123' }),
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
