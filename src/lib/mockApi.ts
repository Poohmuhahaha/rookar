import { startOfMonth, subMonths } from 'date-fns'
import {
  formatCompact,
  formatCurrency,
  formatDateThai,
  formatNumber,
  formatPercent,
  initialsFromName,
  monthLabel,
} from './format'
import type {
  AiStreamEvent,
  BusinessProfile,
  ChatMessage,
  Conversation,
  CostSlice,
  DashboardRange,
  DashboardSummary,
  DataSource,
  DataType,
  ImportPreview,
  SectorBenchmark,
  Session,
} from '@/types'

const SESSION_KEY = 'rookar.session.v1'
const SOURCES_KEY = 'rookar.sources.v1'
const CONVERSATIONS_KEY = 'rookar.conversations.v1'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

function daysAgo(days: number, hour = 10): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(hour, 30, 0, 0)
  if (date.getTime() > Date.now()) date.setTime(Date.now() - 35 * 60 * 1000)
  return date.toISOString()
}

function demoSession(email = 'demo@rookar.co', name = 'ภีม ธีรภัทร'): Session {
  return {
    user: {
      id: 'user_demo',
      name,
      email,
      role: 'owner',
      initials: initialsFromName(name),
      avatarUrl: '/avatar.jpg',
    },
    business: {
      name: 'บลูมมิ่ง คอฟฟี่',
      type: 'fnb',
      typeLabel: 'อาหารและเครื่องดื่ม',
      employees: '11-30',
      revenueRange: '1-3 ล้านบาท',
      goals: ['เพิ่มกำไร', 'ลดต้นทุน'],
    },
    onboardingComplete: true,
    plan: 'Pro',
    createdAt: new Date().toISOString(),
  }
}

function demoSources(): DataSource[] {
  const month = new Intl.DateTimeFormat('th-TH', {
    month: 'short',
    year: 'numeric',
  }).format(new Date())
  return [
    {
      id: 'ds_sales',
      name: 'ยอดขายรายวัน',
      type: 'sales',
      typeLabel: 'ยอดขาย',
      rowCount: 365,
      quality: 'complete',
      updatedAt: daysAgo(1, 9),
      period: `ม.ค. – ${month}`,
      fileName: 'sales_daily_2026.csv',
    },
    {
      id: 'ds_materials',
      name: 'ต้นทุนวัตถุดิบ',
      type: 'materials',
      typeLabel: 'ต้นทุนวัตถุดิบ',
      rowCount: 248,
      quality: 'partial',
      updatedAt: daysAgo(3, 14),
      period: `มี.ค. – ${month}`,
      fileName: 'ingredient_cost_oct.csv',
    },
    {
      id: 'ds_labor',
      name: 'ค่าแรงพนักงาน',
      type: 'labor',
      typeLabel: 'ค่าแรง',
      rowCount: 120,
      quality: 'complete',
      updatedAt: daysAgo(5, 11),
      period: `มิ.ย. – ${month}`,
      fileName: 'payroll_oct_2026.csv',
    },
    {
      id: 'ds_expenses',
      name: 'ค่าใช้จ่ายดำเนินงาน',
      type: 'expenses',
      typeLabel: 'ค่าใช้จ่ายอื่น',
      rowCount: 86,
      quality: 'duplicate',
      updatedAt: daysAgo(8, 16),
      period: `พ.ค. – ${month}`,
      fileName: 'operating_expenses.csv',
    },
  ]
}

function seedDemoData() {
  const current = readJson<DataSource[]>(SOURCES_KEY, [])
  if (current.length === 0) {
    writeJson(SOURCES_KEY, demoSources())
  }
}

export function getSession(): Session | null {
  const session = readJson<Session | null>(SESSION_KEY, null)
  if (session) {
    if (!session.plan) {
      session.plan = session.business ? 'Pro' : 'Free'
    }
    if (!session.user.avatarUrl) {
      session.user.avatarUrl = '/avatar.jpg'
    }
  }
  return session
}

export async function seedSampleSources(): Promise<DataSource[]> {
  await sleep(500)
  const sources = demoSources()
  writeJson(SOURCES_KEY, sources)
  return sources
}

function saveSession(session: Session | null) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY)
    return
  }
  writeJson(SESSION_KEY, session)
}

export async function login(email: string, password: string): Promise<Session> {
  await sleep(650)
  if (password.length < 8) {
    throw new Error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
  }
  if (email.toLowerCase() === 'blocked@rookar.co') {
    throw new Error('บัญชีนี้ถูกระงับชั่วคราว กรุณาติดต่อทีมงาน')
  }

  const session = demoSession(email)
  saveSession(session)
  seedDemoData()
  return session
}

export async function signup(
  name: string,
  email: string,
  _password: string,
): Promise<Session> {
  await sleep(750)
  const session: Session = {
    user: {
      id: uid('user'),
      name,
      email,
      role: 'owner',
      initials: initialsFromName(name),
    },
    business: null,
    onboardingComplete: false,
    plan: 'Free',
    createdAt: new Date().toISOString(),
  }
  writeJson(SOURCES_KEY, [])
  localStorage.removeItem(CONVERSATIONS_KEY)
  saveSession(session)
  return session
}

export async function logout(): Promise<void> {
  await sleep(250)
  saveSession(null)
}

export async function saveBusiness(profile: BusinessProfile): Promise<Session> {
  await sleep(500)
  const session = getSession()
  if (!session) throw new Error('ไม่พบเซสชัน')
  const next: Session = {
    ...session,
    business: profile,
    onboardingComplete: true,
  }
  saveSession(next)
  return next
}

export async function skipBusiness(): Promise<Session> {
  await sleep(350)
  const session = getSession()
  if (!session) throw new Error('ไม่พบเซสชัน')
  const next: Session = {
    ...session,
    business: null,
    onboardingComplete: true,
  }
  saveSession(next)
  return next
}

export async function listSources(): Promise<DataSource[]> {
  await sleep(450)
  return readJson<DataSource[]>(SOURCES_KEY, [])
}

export async function getSourceById(id: string): Promise<DataSource | null> {
  await sleep(200)
  const sources = readJson<DataSource[]>(SOURCES_KEY, [])
  return sources.find((s) => s.id === id) ?? null
}

export async function getSourceRows(id: string): Promise<{
  columns: { key: string; label: string }[]
  rows: Record<string, string | number>[]
}> {
  await sleep(250)
  const source = await getSourceById(id)
  if (!source) return { columns: [], rows: [] }

  if (source.type === 'sales') {
    return {
      columns: [
        { key: 'date', label: 'วันที่' },
        { key: 'amount', label: 'ยอดขาย (บาท)' },
        { key: 'orders', label: 'จำนวนออเดอร์' },
        { key: 'channel', label: 'ช่องทางจำหน่าย' },
      ],
      rows: [
        { date: '2026-10-24', amount: '48,250', orders: 142, channel: 'หน้าร้าน' },
        { date: '2026-10-23', amount: '42,100', orders: 128, channel: 'เดลิเวอรี' },
        { date: '2026-10-22', amount: '51,400', orders: 156, channel: 'หน้าร้าน' },
        { date: '2026-10-21', amount: '39,800', orders: 115, channel: 'เดลิเวอรี' },
        { date: '2026-10-20', amount: '46,300', orders: 139, channel: 'หน้าร้าน' },
        { date: '2026-10-19', amount: '37,900', orders: 108, channel: 'เดลิเวอรี' },
        { date: '2026-10-18', amount: '55,600', orders: 168, channel: 'หน้าร้าน' },
        { date: '2026-10-17', amount: '53,200', orders: 160, channel: 'หน้าร้าน' },
      ],
    }
  }

  if (source.type === 'materials') {
    return {
      columns: [
        { key: 'date', label: 'วันที่' },
        { key: 'item', label: 'รายการวัตถุดิบ' },
        { key: 'quantity', label: 'จำนวน' },
        { key: 'unitPrice', label: 'ราคาต่อหน่วย (บาท)' },
        { key: 'total', label: 'ยอดรวม (บาท)' },
      ],
      rows: [
        { date: '2026-10-22', item: 'เมล็ดกาแฟ House Blend 10kg', quantity: '5 ถุง', unitPrice: '2,800', total: '14,000' },
        { date: '2026-10-21', item: 'นมสด Meiji 2L', quantity: '40 แกลลอน', unitPrice: '94', total: '3,760' },
        { date: '2026-10-20', item: 'แก้วกาแฟเย็น 16oz + ฝา', quantity: '1,000 ชุด', unitPrice: '2.8', total: '2,800' },
        { date: '2026-10-19', item: 'ไซรัปคาราเมล Monin 700ml', quantity: '6 ขวด', unitPrice: '380', total: '2,280' },
        { date: '2026-10-18', item: 'เมล็ดกาแฟ Single Origin Ethiopia', quantity: '3 ถุง', unitPrice: '1,450', total: '4,350' },
        { date: '2026-10-17', item: 'ผงชาเขียวมัทฉะ Uji 500g', quantity: '2 ถุง', unitPrice: '950', total: '1,900' },
      ],
    }
  }

  if (source.type === 'labor') {
    return {
      columns: [
        { key: 'date', label: 'รอบวันที่' },
        { key: 'name', label: 'ชื่อพนักงาน' },
        { key: 'role', label: 'ตำแหน่ง' },
        { key: 'hours', label: 'ชั่วโมงทำงาน' },
        { key: 'amount', label: 'ค่าจ้างรวม (บาท)' },
      ],
      rows: [
        { date: '2026-10-01 - 2026-10-15', name: 'กิตติศักดิ์ พรหมมา', role: 'Head Barista', hours: '80 ชม.', amount: '18,500' },
        { date: '2026-10-01 - 2026-10-15', name: 'ธนภัทร ใจดี', role: 'Barista (Full-time)', hours: '80 ชม.', amount: '14,000' },
        { date: '2026-10-01 - 2026-10-15', name: 'พิมพ์มาดา วงศ์สุวรรณ', role: 'Barista (Part-time)', hours: '45 ชม.', amount: '6,750' },
        { date: '2026-10-01 - 2026-10-15', name: 'สุริยา มิ่งเมือง', role: 'Kitchen Helper', hours: '60 ชม.', amount: '8,400' },
      ],
    }
  }

  return {
    columns: [
      { key: 'date', label: 'วันที่' },
      { key: 'category', label: 'หมวดหมู่' },
      { key: 'description', label: 'รายละเอียด' },
      { key: 'amount', label: 'ยอดเงิน (บาท)' },
    ],
    rows: [
      { date: '2026-10-05', category: 'ค่าเช่าสถานที่', description: 'ค่าเช่าพื้นที่สาขาหลัก ประจำเดือน ต.ค.', amount: '45,000' },
      { date: '2026-10-10', category: 'สาธารณูปโภค', description: 'ค่าไฟฟ้ารอบเดือน ก.ย.', amount: '18,420' },
      { date: '2026-10-12', category: 'การตลาด', description: 'ค่าโฆษณา Facebook & IG Ads', amount: '8,500' },
      { date: '2026-10-15', category: 'บำรุงรักษา', description: 'ล้างเครื่องชงกาแฟ La Marzocco', amount: '3,200' },
    ],
  }
}

export async function deleteSource(id: string): Promise<void> {
  await sleep(350)
  const sources = readJson<DataSource[]>(SOURCES_KEY, [])
  writeJson(
    SOURCES_KEY,
    sources.filter((source) => source.id !== id),
  )
}

const fullRevenue = [
  720_000, 684_000, 762_000, 808_000, 786_000, 862_000, 918_000, 904_000,
  982_000, 1_042_000, 1_118_000, 1_284_500,
]
const fullProfit = [
  178_000, 164_000, 192_000, 211_000, 204_000, 229_000, 248_000, 241_000,
  266_000, 281_000, 303_000, 342_800,
]

const sixMonthSnapshot = (() => {
  const revenue = fullRevenue.slice(-6).reduce((sum, value) => sum + value, 0)
  const profit = fullProfit.slice(-6).reduce((sum, value) => sum + value, 0)
  return {
    revenue,
    profit,
    cost: revenue - profit,
    margin: (profit / revenue) * 100,
  }
})()

function seriesForLastMonths(count: number) {
  const now = startOfMonth(new Date())
  return Array.from({ length: 12 }, (_, index) => {
    const date = subMonths(now, 11 - index)
    return {
      label: monthLabel(date),
      revenue: fullRevenue[index],
      profit: fullProfit[index],
    }
  }).slice(-count)
}

export async function getDashboard(
  range: '3m' | '6m' | '12m',
): Promise<DashboardSummary | null> {
  await sleep(520)
  const sources = readJson<DataSource[]>(SOURCES_KEY, [])
  if (sources.length === 0) return null

  const count = range === '3m' ? 3 : range === '6m' ? 6 : 12
  const series = seriesForLastMonths(count)

  const revenue = series.reduce((sum, point) => sum + point.revenue, 0)
  const profit = series.reduce((sum, point) => sum + point.profit, 0)
  const cost = revenue - profit
  const margin = (profit / revenue) * 100

  const revenueDelta = 12.4
  const profitDelta = 8.1
  const costDelta = 3.2
  const marginDelta = 1.8

  const costBreakdown: CostSlice[] = [
    {
      key: 'materials',
      label: 'วัตถุดิบ',
      value: Math.round(cost * 0.52),
      share: 52,
      color: '#000000',
    },
    {
      key: 'labor',
      label: 'ค่าแรง',
      value: Math.round(cost * 0.28),
      share: 28,
      color: '#D97706',
    },
    {
      key: 'expenses',
      label: 'ค่าใช้จ่ายอื่น',
      value: Math.round(cost * 0.2),
      share: 20,
      color: '#4F6F6B',
    },
  ]

  const rangeLabel =
    range === '3m' ? '3 เดือนล่าสุด' : range === '6m' ? '6 เดือนล่าสุด' : '12 เดือนล่าสุด'

  return {
    rangeLabel,
    revenue,
    profit,
    cost,
    margin,
    revenueDelta,
    profitDelta,
    costDelta,
    marginDelta,
    series,
    revenueSpark: series.map((point) => point.revenue),
    profitSpark: series.map((point) => point.profit),
    costSpark: series.map((point) => point.revenue - point.profit),
    marginSpark: series.map((point) => (point.profit / point.revenue) * 100),
    costBreakdown,
    insight: {
      title: 'ต้นทุนบรรจุภัณฑ์กำลังกัดกำไร',
      body: 'ต้นทุนวัตถุดิบเพิ่มขึ้น 6.2% ใน 30 วันล่าสุด โดยหลักมาจากบรรจุภัณฑ์ ขณะที่ยอดขายยังโต 12.4% ทำให้กำไรโดยรวมยังอยู่ในเกณฑ์ดี',
      action: 'ถาม AI ต่อ',
      prompt: 'ต้นทุนบรรจุภัณฑ์เพิ่มขึ้นเพราะอะไร และควรลดอย่างไร',
    },
    benchmark: {
      sectorName: 'ภาคบริการ อาหารและเครื่องดื่ม',
      sectorGdpGrowth: 3.8,
      privateConsumptionGrowth: 2.1,
      inflationCpi: 1.4,
      businessGrowth: revenueDelta,
      outperformance: Number((revenueDelta - 3.8).toFixed(1)),
      status: 'outperforming',
      assessment:
        'ยอดขายร้านคุณเติบโต +12.4% แข็งแกร่งกว่า GDP ภาคอาหาร (+3.8%) และดัชนีบริโภคเอกชน (+2.1%) สะท้อนว่าร้านโตจากการขยายฐานลูกค้าและส่วนแบ่งตลาด ไม่ใช่แค่ตลาดหนุน',
      period: 'ไตรมาส 3/2569',
      source: 'สภาพัฒน์ (สศช.) · ธนาคารแห่งประเทศไทย',
    },
    lastUpdated: new Date().toISOString(),
  }
}

type CsvRow = Record<string, string>

function parseCsvLine(line: string): string[] {
  const values: string[] = []
  let value = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        value += '"'
        i += 1
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

function sampleColumns(type: DataType): string[] {
  if (type === 'sales') return ['วันที่', 'ยอดขาย', 'จำนวนออเดอร์', 'ช่องทาง']
  if (type === 'materials') return ['วันที่', 'วัตถุดิบ', 'จำนวน', 'ราคาต่อหน่วย', 'รวม']
  if (type === 'labor') return ['วันที่', 'ชื่อพนักงาน', 'ตำแหน่ง', 'ชั่วโมงทำงาน', 'ค่าแรง']
  return ['วันที่', 'หมวดหมู่', 'รายละเอียด', 'จำนวนเงิน']
}

function sampleRows(type: DataType): CsvRow[] {
  if (type === 'sales') {
    return [
      { วันที่: '2026-10-18', ยอดขาย: '42,850', จำนวนออเดอร์: '126', ช่องทาง: 'หน้าร้าน' },
      { วันที่: '2026-10-19', ยอดขาย: '38,420', จำนวนออเดอร์: '112', ช่องทาง: 'หน้าร้าน' },
      { วันที่: '2026-10-20', ยอดขาย: '45,190', จำนวนออเดอร์: '134', ช่องทาง: 'เดลิเวอรี' },
      { วันที่: '2026-10-21', ยอดขาย: '41,760', จำนวนออเดอร์: '121', ช่องทาง: 'หน้าร้าน' },
      { วันที่: '2026-10-22', ยอดขาย: '48,920', จำนวนออเดอร์: '142', ช่องทาง: 'เดลิเวอรี' },
    ]
  }
  if (type === 'materials') {
    return [
      { วันที่: '2026-10-18', วัตถุดิบ: 'เมล็ดกาแฟคั่ว', จำนวน: '12 กก.', ราคาต่อหน่วย: '680', รวม: '8,160' },
      { วันที่: '2026-10-18', วัตถุดิบ: 'นมสด', จำนวน: '48 ลิตร', ราคาต่อหน่วย: '52', รวม: '2,496' },
      { วันที่: '2026-10-19', วัตถุดิบ: 'แก้วกระดาษ', จำนวน: '1,000 ใบ', ราคาต่อหน่วย: '2.8', รวม: '2,800' },
      { วันที่: '2026-10-20', วัตถุดิบ: 'ไซรัป', จำนวน: '24 ขวด', ราคาต่อหน่วย: '185', รวม: '4,440' },
      { วันที่: '2026-10-21', วัตถุดิบ: 'ฝาแก้ว', จำนวน: '1,000 ใบ', ราคาต่อหน่วย: '1.1', รวม: '1,100' },
    ]
  }
  if (type === 'labor') {
    return [
      { วันที่: '2026-10-01', ชื่อพนักงาน: 'อนันต์', ตำแหน่ง: 'บาริสต้า', ชั่วโมงทำงาน: '168', ค่าแรง: '18,500' },
      { วันที่: '2026-10-01', ชื่อพนักงาน: 'มีน', ตำแหน่ง: 'บาริสต้า', ชั่วโมงทำงาน: '160', ค่าแรง: '17,200' },
      { วันที่: '2026-10-01', ชื่อพนักงาน: 'เจมส์', ตำแหน่ง: 'พนักงานเสิร์ฟ', ชั่วโมงทำงาน: '152', ค่าแรง: '15,800' },
      { วันที่: '2026-10-01', ชื่อพนักงาน: 'ใบเฟิร์น', ตำแหน่ง: 'แคชเชียร์', ชั่วโมงทำงาน: '144', ค่าแรง: '15,200' },
      { วันที่: '2026-10-01', ชื่อพนักงาน: 'ต้น', ตำแหน่ง: 'ผู้จัดการร้าน', ชั่วโมงทำงาน: '176', ค่าแรง: '26,000' },
    ]
  }
  return [
    { วันที่: '2026-10-01', หมวดหมู่: 'ค่าเช่า', รายละเอียด: 'ค่าเช่าพื้นที่', จำนวนเงิน: '45,000' },
    { วันที่: '2026-10-03', หมวดหมู่: 'ค่าน้ำค่าไฟ', รายละเอียด: 'ค่าไฟฟ้า', จำนวนเงิน: '12,480' },
    { วันที่: '2026-10-05', หมวดหมู่: 'การตลาด', รายละเอียด: 'โฆษณาออนไลน์', จำนวนเงิน: '8,500' },
    { วันที่: '2026-10-08', หมวดหมู่: 'ขนส่ง', รายละเอียด: 'ค่าส่งวัตถุดิบ', จำนวนเงิน: '3,200' },
    { วันที่: '2026-10-12', หมวดหมู่: 'ซ่อมบำรุง', รายละเอียด: 'ซ่อมเครื่องชงกาแฟ', จำนวนเงิน: '4,800' },
  ]
}

export async function createImportPreview(
  file: File,
  type: DataType,
): Promise<ImportPreview> {
  await sleep(900)
  let columns = sampleColumns(type)
  let rows = sampleRows(type)
  let totalRows = 128

  if (!file.name.toLowerCase().endsWith('.csv')) {
    throw new Error('รองรับเฉพาะไฟล์ CSV ในเวอร์ชันทดลองนี้')
  }

  const text = (await file.text()).replace(/^\uFEFF/, '')
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (lines.length < 2) {
    throw new Error('ไฟล์ CSV ต้องมีหัวตารางและข้อมูลอย่างน้อย 1 แถว')
  }

  const headers = parseCsvLine(lines[0]).map((header, index) => header || `คอลัมน์ ${index + 1}`)
  const values = lines.slice(1)
  columns = headers
  rows = values.slice(0, 5).map((line) => {
    const cells = parseCsvLine(line)
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']))
  })
  totalRows = values.length

  const errorRows = totalRows >= 20 ? 3 : 0
  const duplicateRows = totalRows >= 20 ? 2 : 0
  const errors = [
    { row: 7, field: columns[0] ?? 'วันที่', message: 'รูปแบบวันที่ไม่ถูกต้อง (คาดว่า YYYY-MM-DD)' },
    { row: 18, field: columns[1] ?? 'จำนวน', message: 'ต้องเป็นตัวเลขและมากกว่าศูนย์' },
    { row: 23, field: columns[2] ?? 'หมวดหมู่', message: 'ไม่พบหมวดหมู่นี้ในระบบ' },
  ].filter((error) => error.row <= totalRows)

  return {
    fileName: file.name,
    fileSize: file.size,
    totalRows,
    validRows: Math.max(0, totalRows - errors.length - duplicateRows),
    duplicateRows,
    errorRows: errors.length,
    columns,
    rows,
    errors,
    type,
  }
}

export async function commitImport(preview: ImportPreview): Promise<DataSource> {
  await sleep(1000)
  const labels: Record<DataType, { name: string; typeLabel: string }> = {
    sales: { name: 'ยอดขายรายวัน', typeLabel: 'ยอดขาย' },
    materials: { name: 'ต้นทุนวัตถุดิบ', typeLabel: 'ต้นทุนวัตถุดิบ' },
    labor: { name: 'ค่าแรงพนักงาน', typeLabel: 'ค่าแรง' },
    expenses: { name: 'ค่าใช้จ่ายดำเนินงาน', typeLabel: 'ค่าใช้จ่ายอื่น' },
  }
  if (preview.validRows === 0) {
    throw new Error('ไม่มีแถวที่พร้อมนำเข้า')
  }
  const label = labels[preview.type]
  const fileBase = preview.fileName.replace(/\.[^.]+$/, '').trim()
  const source: DataSource = {
    id: uid('ds'),
    name: fileBase ? `${label.name} · ${fileBase}` : label.name,
    type: preview.type,
    typeLabel: label.typeLabel,
    rowCount: preview.validRows,
    quality: preview.errorRows > 0 ? 'partial' : 'complete',
    updatedAt: new Date().toISOString(),
    period: new Intl.DateTimeFormat('th-TH', {
      month: 'short',
      year: 'numeric',
    }).format(new Date()),
    fileName: preview.fileName,
  }
  const sources = readJson<DataSource[]>(SOURCES_KEY, [])
  writeJson(SOURCES_KEY, [source, ...sources])
  return source
}

function buildAnswer(question: string) {
  const normalized = question.toLowerCase()
  const dashboard = sixMonthSnapshot

  if (
    normalized.includes('action plan') ||
    normalized.includes('แผนปฏิบัติ') ||
    normalized.includes('30 วัน') ||
    normalized.includes('ขั้นตอน') ||
    normalized.includes('แผนงาน')
  ) {
    return {
      content: `แผนปฏิบัติการเชิงกลยุทธ์ 30 วันแรก (Strategic Action Plan):

เพื่อยกระดับอัตรากำไรจาก ${formatPercent(dashboard.margin)} สู่เป้าหมาย 28% และควบคุมต้นทุนบรรจุภัณฑ์ที่กำลังเติบโตสูง:

• สัปดาห์ที่ 1: เจรจากับ Supplier บรรจุภัณฑ์ 2 เจ้า เพื่อขอส่วนลด 5% สำหรับการสั่งซื้อเหมาโหลล่วงหน้า 3 เดือน
• สัปดาห์ที่ 2: เริ่มแคมเปญ "นำแก้วมาเองลด ฿5" เพื่อลดต้นทุนการใช้แก้วพลาสติกและฝาลง ฿3.50 ต่อแก้วทันที
• สัปดาห์ที่ 3: ปรับราคาเฉพาะกลุ่มเมนูพรีเมียม/ซิกเนเจอร์ขึ้น ฿5-฿10 โดยคงราคาเมนูคลาสสิกไว้เท่าเดิมเพื่อรักษาฐานลูกค้า
• สัปดาห์ที่ 4: จัดเซ็ต Combo กาแฟคู่เบเกอรี่ดันยอดต่อบิล (Basket Size) จาก ฿318 เป็น ฿360
• สัปดาห์ที่ 4: ตรวจสอบงบกำไรสุทธิรอบสิ้นเดือน เทียบกับตัวชี้วัดเป้าหมาย Gross Margin 28%

💡 คุณสามารถกดปุ่ม "แปลงเป็น Action Plan" ด้านล่างเพื่อติดตามความคืบหน้ารายสัปดาห์ได้ทันทีครับ`,
      citations: [
        {
          id: 'cit_margin_target',
          title: 'เป้าหมาย Margin ไตรมาสหน้า',
          period: 'พ.ย. – ธ.ค. 2569',
          value: '28.0% (+1.1% จุด)',
          source: 'business_strategy_q4.json',
        },
        {
          id: 'cit_packaging_cost',
          title: 'ต้นทุนบรรจุภัณฑ์ปัจจุบัน',
          period: 'ต.ค. 2569',
          value: '+11.8% YoY',
          source: 'ingredient_cost_oct.csv',
        },
      ],
      type: 'overview' as const,
    }
  }

  if (normalized.includes('จุดคุ้มทุน') || normalized.includes('break-even') || normalized.includes('ขั้นต่ำ')) {
    return {
      content: `การวิเคราะห์จุดคุ้มทุน (Break-even Analysis) ของร้านบลูมมิ่ง คอฟฟี่:

จากข้อมูลต้นทุนคงที่ (Fixed Costs: ค่าเช่า ค่าแรงพื้นฐาน ฯลฯ) รวมประมาณ ฿365,000 ต่อเดือน และ Contribution Margin เฉลี่ย 48%:

• จุดคุ้มทุนรายเดือน: ยอดขายขั้นต่ำต้องอยู่ที่ ฿760,416 ต่อเดือน
• จุดคุ้มทุนรายวัน: ต้องทำยอดขายขั้นต่ำ ฿25,347 ต่อวัน (ประมาณ 80–85 บิลต่อวัน)
• สถานะปัจจุบัน: ยอดขายจริงเฉลี่ยอยู่ที่ ฿1,041,416 ต่อเดือน (สูงกว่าจุดคุ้มทุน +36.9%)

ข้อเสนอแนะ:
• ช่วงวันธรรมดา (จันทร์–พฤหัสบดี) ควรดันยอดขายช่วงบ่ายด้วยชุด Afternoon Coffee Combo
• ร้านมีความปลอดภัยทางการเงิน (Margin of Safety) อยู่ที่ 36.9% ถือว่าสุขภาพการเงินแข็งแรงมากครับ`,
      citations: [
        {
          id: 'cit_fixed_cost',
          title: 'ต้นทุนคงที่รายเดือน',
          period: 'พ.ค. – ต.ค. 2569',
          value: '฿365,000 / เดือน',
          source: 'operating_expenses.csv',
        },
        {
          id: 'cit_margin_safety',
          title: 'Margin of Safety',
          period: 'พ.ค. – ต.ค. 2569',
          value: '+36.9%',
          source: 'sales_daily_2026.csv',
        },
      ],
      type: 'cost' as const,
    }
  }

  if (
    normalized.includes('gdp') ||
    normalized.includes('เศรษฐกิจ') ||
    normalized.includes('ตลาด') ||
    normalized.includes('มหาภาค') ||
    normalized.includes('สศช')
  ) {
    return {
      content: `ผลวิเคราะห์เปรียบเทียบยอดขายร้านกับ GDP ประเทศและตลาด (ไตรมาส 3/2569) ครับ

📊 การเติบโตเปรียบเทียบตลาด (Sector Benchmark):
• ยอดขายร้านคุณเติบโต +12.4% YoY (พ.ค.–ต.ค. 2569)
• GDP ภาคบริการและอาหารเครื่องดื่มของประเทศขยายตัว +3.8% YoY (สศช.)
• ดัชนีการบริโภคภาคเอกชน (Private Consumption) โต +2.1% YoY (ธปท.)
• อัตราเงินเฟ้อทั่วไป (CPI) อยู่ที่ +1.4% YoY

💡 บทวินิจฉัยธุรกิจ (Market Diagnostic):
ร้านของคุณกำลัง "เติบโตชนะตลาด" (+8.6% จุด) ซึ่งหมายความว่าการเติบโตไม่ได้มาจากแค่เศรษฐกิจภาพรวมพาไป แต่ร้านกำลังดึงดูดลูกค้าและสร้างส่วนแบ่งการตลาด (Market Share) จากคู่แข่งในทำเลได้จริง

คำแนะนำเชิงกลยุทธ์:
1. รักษาฐานลูกค้าประจำ: สร้างระบบสมาชิกรองรับเมนูยอดนิยม เพราะกำลังซื้อผู้บริโภคทั่วไปเริ่มระมัดระวังขึ้น
2. คุมต้นทุนล่วงหน้า: เงินเฟ้อหมวดอาหารและบรรจุภัณฑ์ขยับขึ้น 2.9% แนะนำเจรจาราคาวัตถุดิบล่วงหน้า 3 เดือน`,
      citations: [
        {
          id: 'cit_nesdc_gdp',
          title: 'GDP ภาคอาหารและบริการ Q3/2569 (+3.8%)',
          period: 'ไตรมาส 3/2569',
          value: 'สศช. (สภาพัฒน์)',
          source: 'nesdc_macro_economic_report_q3.json',
        },
        {
          id: 'cit_bot_pci',
          title: 'ดัชนีการบริโภคภาคเอกชน (+2.1%)',
          period: 'ต.ค. 2569',
          value: 'ธนาคารแห่งประเทศไทย (ธปท.)',
          source: 'bot_economic_indicators.json',
        },
        {
          id: 'cit_sales',
          title: 'ยอดขายร้านบลูมมิ่ง คอฟฟี่ (+12.4%)',
          period: 'พ.ค. – ต.ค. 2569',
          value: formatCurrency(dashboard.revenue),
          source: 'sales_daily_2026.csv',
        },
      ],
      type: 'overview' as const,
    }
  }

  if (
    normalized.includes('ตั้งราคา') ||
    normalized.includes('กลยุทธ์ราคา') ||
    normalized.includes('เงินเฟ้อ') ||
    normalized.includes('cpi') ||
    normalized.includes('pricing')
  ) {
    return {
      content: `คำแนะนำกลยุทธ์ตั้งราคาและรับมือเงินเฟ้อ (Macro Strategic Pricing):

จากข้อมูลเงินเฟ้อทั่วไป (CPI +1.4%) และเงินเฟ้อหมวดอาหาร/เครื่องดื่ม (+2.9%) ควบคู่กับมาร์จิ้นของร้านปัจจุบันที่ ${formatPercent(dashboard.margin)}:

1. กลยุทธ์แยกชั้นราคา (Tiered Pricing):
• คงราคา "เมนูหลัก (Hero Drinks)" เช่น อเมริกาโน่ ลาเต้ ไว้ที่ราคาเดิม เพื่อรักษากลุ่มลูกค้าประจำที่อ่อนไหวต่อราคา
• ปรับขึ้น ฿5–฿10 เฉพาะ "เมนูซิกเนเจอร์/พรีเมียม" (Specialty Coffee, Dirty, Seasonal Drinks) ซึ่งเป็นกลุ่มลูกค้ายอมจ่ายเพื่อรสชาติ

2. บริหารต้นทุนบรรจุภัณฑ์:
• ค่าบรรจุภัณฑ์โตเร็วที่สุด (+11.8%) ควรเสนอส่วนลด ฿5 เมื่อลูกค้านำแก้วมาเอง ช่วยลดต้นทุนแก้วและฝาลง ฿3–4 ต่อแก้วทันที

3. จัดชุดคอมโบเพิ่มยอดต่อบิล (Basket Size):
• จัด Bundle กาแฟคู่กับเบเกอรี่ในราคาพิเศษ เพิ่มยอดเฉลี่ยต่อบิลจาก ฿318 เป็น ฿360 เพื่อรักษาผลกำไรรวมให้ชนะเงินเฟ้อ`,
      citations: [
        {
          id: 'cit_cpi_food',
          title: 'ดัชนีเงินเฟ้อหมวดอาหาร (+2.9%)',
          period: 'ก.ย. – ต.ค. 2569',
          value: 'กระทรวงพาณิชย์ (สนค.)',
          source: 'dit_inflation_bulletin.json',
        },
        {
          id: 'cit_margin',
          title: 'อัตรากำไรปัจจุบัน',
          period: 'พ.ค. – ต.ค. 2569',
          value: formatPercent(dashboard.margin),
          source: 'sales_daily_2026.csv',
        },
      ],
      type: 'profit' as const,
    }
  }

  if (normalized.includes('ต้นทุน') || normalized.includes('วัตถุดิบ') || normalized.includes('บรรจุ')) {
    return {
      content: `จากข้อมูล 6 เดือนล่าสุด ต้นทุนวัตถุดิบอยู่ที่ ${formatCurrency(dashboard.cost * 0.52)} หรือคิดเป็น 52% ของต้นทุนรวม

• ต้นทุนวัตถุดิบเพิ่มขึ้น 6.2% เมื่อเทียบกับช่วงก่อน
• หมวดที่เพิ่มมากที่สุดคือบรรจุภัณฑ์ (+11.8%)
• ยอดขายโต 12.4% จึงยังชดเชยต้นทุนที่เพิ่มได้

ข้อเสนอ: ลองเจรจาราคาบรรจุภัณฑ์กับ supplier 2 ราย หรือปรับขนาดแก้ว/กล่องให้เหมาะกับเมนูขายดีก่อนครับ`,
      citations: [
        {
          id: 'cit_mat',
          title: 'ต้นทุนวัตถุดิบ',
          period: 'พ.ค. – ต.ค. 2569',
          value: formatCurrency(dashboard.cost * 0.52),
          source: 'ingredient_cost_oct.csv',
        },
        {
          id: 'cit_sales',
          title: 'ยอดขายรายวัน',
          period: 'พ.ค. – ต.ค. 2569',
          value: formatCurrency(dashboard.revenue),
          source: 'sales_daily_2026.csv',
        },
      ],
      type: 'cost' as const,
    }
  }

  if (normalized.includes('กำไร') || normalized.includes('margin') || normalized.includes('อัตรา')) {
    return {
      content: `กำไรสุทธิ 6 เดือนล่าสุดอยู่ที่ ${formatCurrency(dashboard.profit)} จากรายได้ ${formatCurrency(dashboard.revenue)} คิดเป็นอัตรากำไร ${formatPercent(dashboard.margin)}

• กำไรเติบโต 8.1% เมื่อเทียบช่วงก่อน
• เดือน ต.ค. ทำกำไรได้ดีที่สุดในรอบ 6 เดือน
• ต้นทุนวัตถุดิบยังเป็นตัวกดอัตรากำไรหลัก

ถ้าลดต้นทุนวัตถุดิบได้ 5% โดยที่ยอดขายเท่าเดิม กำไรจะเพิ่มขึ้นประมาณ ${formatCurrency(dashboard.cost * 0.52 * 0.05)} ครับ`,
      citations: [
        {
          id: 'cit_profit',
          title: 'กำไรสุทธิ',
          period: 'พ.ค. – ต.ค. 2569',
          value: formatCurrency(dashboard.profit),
          source: 'sales_daily_2026.csv',
        },
      ],
      type: 'profit' as const,
    }
  }

  if (normalized.includes('ยอดขาย') || normalized.includes('รายได้') || normalized.includes('ขาย')) {
    return {
      content: `ยอดขาย 6 เดือนล่าสุดรวม ${formatCurrency(dashboard.revenue)} เติบโต 12.4% เมื่อเทียบช่วงก่อน

• เดือน ต.ค. มียอดขายสูงสุด ${formatCurrency(1_284_500)}
• ช่องทางเดลิเวอรีเติบโตเร็วกว่าหน้าร้าน
• ค่าเฉลี่ยต่อออเดอร์อยู่ที่ ฿318 เพิ่มขึ้น 4.6%

แนวโน้มยังเป็นบวก แต่ควรเฝ้าดูต้นทุนบรรจุภัณฑ์ที่โตตามออเดอร์เดลิเวอรีครับ`,
      citations: [
        {
          id: 'cit_rev',
          title: 'ยอดขายรายวัน',
          period: 'พ.ค. – ต.ค. 2569',
          value: formatCurrency(dashboard.revenue),
          source: 'sales_daily_2026.csv',
        },
      ],
      type: 'sales' as const,
    }
  }

  if (normalized.includes('ทำนาย') || normalized.includes('แนวโน้ม') || normalized.includes('คาด')) {
    return {
      content: `จากแนวโน้ม 6 เดือนล่าสุด คาดว่ารายได้เดือน พ.ย. จะอยู่ที่ประมาณ ${formatCurrency(1_336_000)} ±5%

• อัตราเติบโตเฉลี่ย 3 เดือนล่าสุดอยู่ที่ 6.8% ต่อเดือน
• กำไรคาดว่าจะอยู่ที่ประมาณ ${formatCurrency(352_000)}
• ความไม่แน่นอนหลักคือราคาวัตถุดิบและจำนวนออเดอร์เดลิเวอรี

นี่เป็นการประมาณจากข้อมูลในระบบ ไม่ใช่การรับประกันผลลัพธ์ ควรใช้ร่วมกับแผนธุรกิจจริงครับ`,
      citations: [
        {
          id: 'cit_forecast',
          title: 'แนวโน้มจากยอดขายรายวัน',
          period: 'ส.ค. – ต.ค. 2569',
          value: 'เฉลี่ย +6.8% / เดือน',
          source: 'sales_daily_2026.csv',
        },
      ],
      type: 'forecast' as const,
    }
  }

  return {
    content: `ภาพรวมธุรกิจ 6 เดือนล่าสุดอยู่ในเกณฑ์ดีครับ

• รายได้รวม ${formatCurrency(dashboard.revenue)} (+12.4%)
• กำไรสุทธิ ${formatCurrency(dashboard.profit)} (+8.1%)
• อัตรากำไร ${formatPercent(dashboard.margin)}
• ต้นทุนรวม ${formatCurrency(dashboard.cost)} (+3.2%)

จุดที่ควรจับตาคือต้นทุนวัตถุดิบ โดยเฉพาะบรรจุภัณฑ์ที่โตตามยอดขายเดลิเวอรี ถ้าลองถามเจาะเรื่องต้นทุนหรือกำไร ผมช่วยวิเคราะห์ต่อได้ครับ`,
    citations: [
      {
        id: 'cit_overview',
        title: 'สรุปภาพรวมธุรกิจ',
        period: 'พ.ค. – ต.ค. 2569',
        value: formatCurrency(dashboard.revenue),
        source: 'sales_daily_2026.csv',
      },
      {
        id: 'cit_cost',
        title: 'ต้นทุนรวม',
        period: 'พ.ค. – ต.ค. 2569',
        value: formatCurrency(dashboard.cost),
        source: 'ingredient_cost_oct.csv',
      },
    ],
    type: 'overview' as const,
  }
}

export async function* streamAiReply(
  question: string,
): AsyncGenerator<AiStreamEvent> {
  await sleep(420)
  const answer = buildAnswer(question)
  const chunks = answer.content.match(/.{1,4}/gs) ?? [answer.content]
  for (const chunk of chunks) {
    await sleep(14 + Math.random() * 18)
    yield { type: 'token', value: chunk }
  }
  await sleep(160)
  for (const citation of answer.citations) {
    yield { type: 'citation', citation }
    await sleep(90)
  }
  yield { type: 'done' }
}

const samplePortraitThumbnail =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" width="100%" height="100%">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fcd8c9"/>
        <stop offset="55%" stop-color="#ebb3a2"/>
        <stop offset="100%" stop-color="#cb8579"/>
      </linearGradient>
    </defs>
    <rect width="320" height="180" rx="14" fill="url(#bg)"/>
    <path d="M210 180 C206 148 195 132 182 122 C176 117 174 110 174 100 C174 97 176 94 176 87 C176 80 171 77 171 74 C171 70 174 68 174 64 C172 60 164 58 164 52 C164 44 169 37 169 30 C169 14 153 3 133 3 C109 3 93 20 93 45 C93 63 96 77 96 90 C96 105 99 120 101 135 C104 155 106 172 106 180 Z" fill="#1b2430"/>
  </svg>`)

const conversationToday: Conversation = {
  id: 'conv_today',
  title: 'วิเคราะห์แนวโน้มธุรกิจ (Visual exploration)',
  preview: 'ต้นทุนวัตถุดิบเพิ่มขึ้น 6.2% โดยหลักมาจากบรรจุภัณฑ์…',
  updatedAt: daysAgo(0, 11),
  group: 'วันนี้',
  avatars: ['AL', 'RK'],
  messages: [
    {
      id: 'm1',
      role: 'user',
      content: 'ต้นทุนวัตถุดิบเพิ่มขึ้นเพราะอะไร และควรลดอย่างไร',
      createdAt: daysAgo(0, 11),
    },
    {
      id: 'm2',
      role: 'assistant',
      content:
        `จากข้อมูล 6 เดือนล่าสุด ต้นทุนวัตถุดิบอยู่ที่ ${formatCurrency(sixMonthSnapshot.cost * 0.52)} หรือคิดเป็น 52% ของต้นทุนรวม\n\n• ต้นทุนวัตถุดิบเพิ่มขึ้น 6.2% เมื่อเทียบกับช่วงก่อน\n• หมวดที่เพิ่มมากที่สุดคือบรรจุภัณฑ์ (+11.8%)\n• ยอดขายโต 12.4% จึงยังชดเชยต้นทุนที่เพิ่มได้\n\nข้อเสนอ: ลองเจรจาราคาบรรจุภัณฑ์กับ supplier 2 ราย หรือปรับขนาดแก้ว/กล่องให้เหมาะกับเมนูขายดีก่อนครับ`,
      citations: [
        {
          id: 'c1',
          title: 'ต้นทุนวัตถุดิบ',
          period: 'พ.ค. – ต.ค. 2569',
          value: formatCurrency(sixMonthSnapshot.cost * 0.52),
          source: 'ingredient_cost_oct.csv',
        },
      ],
      feedback: null,
      createdAt: daysAgo(0, 11),
    },
  ],
}

const conversationYesterday: Conversation = {
  id: 'conv_yesterday',
  title: 'สร้างรายงานภาพและแนวโน้ม (Image generation)',
  preview: `กำไรสุทธิ ${formatCurrency(sixMonthSnapshot.profit)} เติบโต 8.1% เมื่อเทียบช่วงก่อน…`,
  updatedAt: daysAgo(1, 15),
  group: 'เมื่อวาน',
  thumbnail: samplePortraitThumbnail,
  avatars: ['AL'],
  messages: [
    {
      id: 'y1',
      role: 'user',
      content: 'สรุปกำไร 6 เดือนล่าสุดให้หน่อย',
      createdAt: daysAgo(1, 15),
    },
    {
      id: 'y2',
      role: 'assistant',
      content:
        `กำไรสุทธิ 6 เดือนล่าสุดอยู่ที่ ${formatCurrency(sixMonthSnapshot.profit)} จากรายได้ ${formatCurrency(sixMonthSnapshot.revenue)} คิดเป็นอัตรากำไร ${formatPercent(sixMonthSnapshot.margin)}\n\n• กำไรเติบโต 8.1% เมื่อเทียบช่วงก่อน\n• เดือน ต.ค. ทำกำไรได้ดีที่สุดในรอบ 6 เดือน\n• ต้นทุนวัตถุดิบยังเป็นตัวกดอัตรากำไรหลัก`,
      citations: [
        {
          id: 'c2',
          title: 'กำไรสุทธิ',
          period: 'พ.ค. – ต.ค. 2569',
          value: formatCurrency(sixMonthSnapshot.profit),
          source: 'sales_daily_2026.csv',
        },
      ],
      feedback: 'up',
      createdAt: daysAgo(1, 15),
    },
  ],
}

const conversationEarlier: Conversation = {
  id: 'conv_earlier',
  title: 'ประชุมทีมกลยุทธ์ (Team session)',
  preview: 'ค่าแรงคิดเป็น 28% ของต้นทุนรวม ควรเริ่มจาก OT และกะทำงาน…',
  updatedAt: daysAgo(4, 9),
  group: 'ก่อนหน้านี้',
  avatars: ['AL', 'MK', 'ST'],
  messages: [
    {
      id: 'e1',
      role: 'user',
      content: 'วางแผนลดค่าแรงช่วงครึ่งปีหลังอย่างไรดี',
      createdAt: daysAgo(4, 9),
    },
    {
      id: 'e2',
      role: 'assistant',
      content:
        `ค่าแรงคิดเป็น 28% ของต้นทุนรวม หรือประมาณ ${formatCurrency(sixMonthSnapshot.cost * 0.28)} ใน 6 เดือนล่าสุด\n\n• เริ่มจากตรวจ OT ที่สูงผิดปกติในวันธรรมดา\n• ปรับตารางกะให้สอดคล้องกับชั่วโมงขายจริง\n• ลดการใช้พนักงานชั่วคราวในวันที่ยอดขายต่ำกว่าเกณฑ์`,
      citations: [
        {
          id: 'c3',
          title: 'ค่าแรงพนักงาน',
          period: 'พ.ค. – ต.ค. 2569',
          value: formatCurrency(sixMonthSnapshot.cost * 0.28),
          source: 'payroll_oct_2026.csv',
        },
      ],
      feedback: null,
      createdAt: daysAgo(4, 9),
    },
  ],
}

const conversationVisual: Conversation = {
  id: 'conv_visual',
  title: 'จำลองผลลัพธ์ฉากทัศน์ (Visualisation)',
  preview: 'ทดสอบการเติบโตยอดขายช่องทางเดลิเวอรี…',
  updatedAt: daysAgo(5, 14),
  group: 'ก่อนหน้านี้',
  avatars: ['AL'],
  messages: [
    {
      id: 'v1',
      role: 'user',
      content: 'ยอดขายช่องทางไหนโตดีที่สุด',
      createdAt: daysAgo(5, 14),
    },
    {
      id: 'v2',
      role: 'assistant',
      content:
        'ช่องทางเดลิเวอรีเติบโตดีที่สุด (+24.2%) ในช่วง 3 เดือนล่าสุด รองลงมาคือหน้าร้าน (+8.5%) ครับ',
      citations: [],
      feedback: null,
      createdAt: daysAgo(5, 14),
    },
  ],
}

export async function getConversations(): Promise<Conversation[]> {
  await sleep(300)
  const stored = readJson<Conversation[] | null>(CONVERSATIONS_KEY, null)
  if (stored) return stored
  const seeded = [conversationToday, conversationYesterday, conversationEarlier, conversationVisual]
  writeJson(CONVERSATIONS_KEY, seeded)
  return seeded
}

export function saveConversations(conversations: Conversation[]) {
  writeJson(CONVERSATIONS_KEY, conversations)
}

export function createMessage(role: 'user' | 'assistant', content = ''): ChatMessage {
  return {
    id: uid('msg'),
    role,
    content,
    streaming: role === 'assistant',
    citations: [],
    feedback: null,
    createdAt: new Date().toISOString(),
  }
}

export function createConversation(title: string): Conversation {
  return {
    id: uid('conv'),
    title,
    preview: '',
    updatedAt: new Date().toISOString(),
    group: 'วันนี้',
    messages: [],
  }
}

export const mockSummaryText = {
  revenue: formatCurrency(1_284_500),
  compactRevenue: formatCompact(1_284_500),
  updated: formatDateThai(new Date()),
  rows: formatNumber(819),
}
