/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from 'vitest'
import {
  commitImport,
  createConversation,
  createImportPreview,
  getConversations,
  getDashboard,
  getSession,
  listSources,
  login,
  logout,
  saveBusiness,
  saveConversations,
  seedSampleSources,
  signup,
} from '@/lib/mockApi'

beforeEach(() => {
  localStorage.clear()
})

describe('mock auth and onboarding', () => {
  it('logs in, seeds demo sources, and restores the session', async () => {
    const session = await login('demo@rookar.co', 'rookar1234')

    expect(session.onboardingComplete).toBe(true)
    expect(session.business?.name).toBe('บลูมมิ่ง คอฟฟี่')
    expect(getSession()?.user.email).toBe('demo@rookar.co')

    const sources = await listSources()
    expect(sources).toHaveLength(4)
  })

  it('rejects short passwords and suspended accounts', async () => {
    await expect(login('demo@rookar.co', 'short')).rejects.toThrow('อย่างน้อย 8 ตัวอักษร')
    await expect(login('blocked@rookar.co', 'rookar1234')).rejects.toThrow('ถูกระงับชั่วคราว')
  })

  it('completes signup and business setup without demo data', async () => {
    const created = await signup('สมชาย ใจดี', 'somchai@example.com', 'Rookar1234!')

    expect(created.onboardingComplete).toBe(false)
    expect(created.user.initials).toBe('สใ')
    expect(await getDashboard('6m')).toBeNull()

    const completed = await saveBusiness({
      name: 'สวนใจดี ออร์แกนิก',
      type: 'fnb',
      typeLabel: 'อาหารและเครื่องดื่ม',
      employees: '11-30',
      revenueRange: '1-3 ล้านบาท',
      goals: ['เพิ่มกำไร'],
    })

    expect(completed.onboardingComplete).toBe(true)
    expect(getSession()?.business?.name).toBe('สวนใจดี ออร์แกนิก')
    expect(await getDashboard('6m')).toBeNull()
  })

  it('seeds sample sources and returns a complete dashboard', async () => {
    await signup('สมชาย ใจดี', 'somchai@example.com', 'Rookar1234!')
    await seedSampleSources()

    const dashboard = await getDashboard('6m')

    expect(dashboard).not.toBeNull()
    expect(dashboard?.rangeLabel).toBe('6 เดือนล่าสุด')
    expect(dashboard?.series).toHaveLength(6)
    expect(dashboard?.revenue).toBe(6_248_500)
    expect(dashboard?.profit).toBe(1_681_800)
    expect(dashboard?.costBreakdown).toHaveLength(3)
  })

  it('logs out cleanly', async () => {
    await login('demo@rookar.co', 'rookar1234')
    await logout()
    expect(getSession()).toBeNull()
  })
})


describe('import and conversation persistence', () => {
  it('parses CSV headers with a BOM and keeps the sample count', async () => {
    const file = new File(
      ['\uFEFFวันที่,ยอดขาย\n2026-10-01,42850\n2026-10-02,39420\n'],
      'october-sales.csv',
      { type: 'text/csv' },
    )

    const preview = await createImportPreview(file, 'sales')

    expect(preview.columns).toEqual(['วันที่', 'ยอดขาย'])
    expect(preview.totalRows).toBe(2)
    expect(preview.validRows).toBe(2)
    expect(preview.rows[0]).toMatchObject({ วันที่: '2026-10-01', ยอดขาย: '42850' })
  })

  it('rejects unsupported file types', async () => {
    const file = new File(['not a csv'], 'sales.xlsx')

    await expect(createImportPreview(file, 'sales')).rejects.toThrow('รองรับเฉพาะไฟล์ CSV')
  })

  it('appends a new import instead of replacing the same source type', async () => {
    await login('demo@rookar.co', 'rookar1234')
    const file = new File(
      ['\uFEFFวันที่,ยอดขาย\n2026-10-01,42850\n2026-10-02,39420\n'],
      'october-sales.csv',
      { type: 'text/csv' },
    )
    const preview = await createImportPreview(file, 'sales')

    const created = await commitImport(preview)
    const sources = await listSources()

    expect(created.name).toContain('october-sales')
    expect(sources).toHaveLength(5)
    expect(sources.filter((source) => source.type === 'sales')).toHaveLength(2)
  })

  it('restores saved conversations', async () => {
    const conversation = createConversation('ทดสอบการบันทึก')
    saveConversations([conversation])

    const restored = await getConversations()

    expect(restored).toHaveLength(1)
    expect(restored[0]?.title).toBe('ทดสอบการบันทึก')
  })
})
