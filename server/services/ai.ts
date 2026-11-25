import { formatCurrency, formatPercent } from '../../src/lib/format'
import type { AgentProfile, AiStreamEvent, Citation, DashboardSummary, SpecialistType } from '../../src/types'
import { getBusiness } from '../auth'
import { db } from '../db'
import { env } from '../env'
import { getDashboard } from './dashboard'
import { industryWithData, listSources, profileForUser } from './sources'
import { getMacroBenchmark } from './macro'
import { runToolCallingAgent } from './toolCalling'

type Answer = { content: string; citations: Citation[] }

export type ChatHistoryEntry = { role: 'user' | 'assistant'; content: string }
export type ChatAttachment = { name: string; content: string }

export type ChatContext = {
  question: string
  industry?: string | null
  language?: 'th' | 'en'
  specialistRole?: SpecialistType
  agentIds?: string[]
  history?: ChatHistoryEntry[]
  attachment?: ChatAttachment | null
  conversationId?: string
  signal?: AbortSignal
}

function topCost(summary: DashboardSummary) {
  return [...summary.costBreakdown].sort((a, b) => b.share - a.share)[0]
}

async function sourceCitations(userId: string, summary: DashboardSummary): Promise<Citation[]> {
  const sources = await listSources(userId)
  const sales = sources.find((source) => source.type === 'sales') ?? sources[0]
  const cost = sources.find((source) => source.type === 'materials') ?? sources[1] ?? sales
  const main = topCost(summary)
  return [
    {
      id: 'cit_revenue',
      title: 'รายได้รวม',
      period: summary.rangeLabel,
      value: formatCurrency(summary.revenue),
      source: sales?.fileName ?? 'sales.csv',
    },
    {
      id: 'cit_cost',
      title: main?.label ?? 'ต้นทุนรวม',
      period: summary.rangeLabel,
      value: formatCurrency(main?.value ?? summary.cost),
      source: cost?.fileName ?? 'cost.csv',
    },
  ]
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max)}\n...(ตัดข้อความบางส่วน)` : value
}

function parseAmount(value: string | undefined): number | null {
  if (!value) return null
  const cleaned = value.replace(/[,\s฿บาท]/g, '').replace(/^"(.*)"$/, '$1')
  if (!cleaned) return null
  const number = Number(cleaned)
  return Number.isFinite(number) ? number : null
}

function summarizeAttachment(attachment: ChatAttachment): string {
  const lines = attachment.content.split(/\r?\n/).filter((line) => line.trim())
  if (lines.length < 2) {
    return `แนบไฟล์ ${attachment.name} แล้ว แต่ไม่พบข้อมูลตารางที่อ่านได้`
  }
  const headerLine = lines[0]
  const delimiter = headerLine.includes('\t') ? '\t' : headerLine.includes(';') ? ';' : ','
  const headers = headerLine.split(delimiter).map((header) => header.trim().replace(/^"(.*)"$/, '$1'))
  const rows = lines.slice(1, 501).map((line) =>
    line.split(delimiter).map((cell) => cell.trim().replace(/^"(.*)"$/, '$1')),
  )
  const numericIndex = headers.findIndex((_, index) => {
    const numericCount = rows.filter((row) => parseAmount(row[index]) !== null).length
    return numericCount > 0 && numericCount >= Math.ceil(rows.length * 0.5)
  })

  if (numericIndex === -1) {
    return `ไฟล์ ${attachment.name}: พบ ${rows.length} แถว (คอลัมน์: ${headers.slice(0, 6).join(', ')})`
  }

  const values = rows.map((row) => parseAmount(row[numericIndex])).filter((value): value is number => value !== null)
  const total = values.reduce((sum, value) => sum + value, 0)
  const average = values.length > 0 ? total / values.length : 0
  const column = headers[numericIndex] || `คอลัมน์ที่ ${numericIndex + 1}`
  return [
    `สรุปไฟล์ ${attachment.name}:`,
    `- จำนวนแถวที่อ่านได้ ${rows.length} แถว`,
    `- คอลัมน์ตัวเลขหลัก: ${column}`,
    `- รวม ${formatCurrency(total)}`,
    `- ค่าเฉลี่ยต่อแถว ${formatCurrency(average)}`,
    values.length > 0 ? `- ค่าต่ำสุด ${formatCurrency(Math.min(...values))} / สูงสุด ${formatCurrency(Math.max(...values))}` : '',
  ].filter(Boolean).join('\n')
}

function specialistLabel(role: SpecialistType) {
  const labels: Record<SpecialistType, string> = {
    general: 'ภาพรวมธุรกิจ',
    finance: 'การเงิน & ต้นทุน',
    market: 'ตลาด & มหภาค',
    strategy: 'กลยุทธ์ & ราคา',
    planning: 'แผนธุรกิจ',
  }
  return labels[role]
}

async function loadAgents(userId: string, ids: string[]): Promise<AgentProfile[]> {
  if (ids.length === 0) return []
  const row = await db.query<{ data_json: string }>('SELECT data_json FROM user_agents WHERE user_id = ?').get(userId)
  if (!row) return []
  try {
    const agents = JSON.parse(row.data_json) as AgentProfile[]
    return agents
      .filter((agent) => ids.includes(agent.id) && agent.enabled !== false)
      .slice(0, 6)
  } catch {
    return []
  }
}

const specialistInstructions: Record<SpecialistType, string> = {
  general: 'ตอบในฐานะผู้ช่วยภาพรวมธุรกิจ เชื่อมโยงยอดขาย ต้นทุน กำไร และบริบทอุตสาหกรรมเข้าด้วยกัน',
  finance: 'โฟกัสการเงินและต้นทุน: โครงสร้างต้นทุน, Gross Margin, Break-even, กระแสเงินสด และจุดรั่วไหลของค่าใช้จ่าย',
  market: 'โฟกัสตลาดและมหภาค: GDP, เงินเฟ้อ CPI, กำลังซื้อ, คู่แข่ง และแนวโน้มอุตสาหกรรม',
  strategy: 'โฟกัสกลยุทธ์และราคา: Positioning, Pricing, Menu/Bundle, Margin และความได้เปรียบในการแข่งขัน',
  planning: 'โฟกัสแผนปฏิบัติการ: แบ่งเป็นรายสัปดาห์ มี KPI วัดผลได้ และระบุผู้รับผิดชอบ/ขั้นตอนถัดไป',
}

async function maybeMacroContext(question: string): Promise<string> {
  const normalized = question.toLowerCase()
  const relevant = ['gdp', 'เศรษฐกิจ', 'มหาภาค', 'เงินเฟ้อ', 'cpi', 'ตลาด', 'กำลังซื้อ']
  if (!relevant.some((keyword) => normalized.includes(keyword))) return ''
  try {
    const macro = await getMacroBenchmark()
    const gdp = macro.indicators.gdpGrowth
    const cpi = macro.indicators.cpiInflation
    const consumption = macro.indicators.householdConsumptionGrowth
    const unemployment = macro.indicators.unemploymentRate
    const debt = macro.indicators.governmentDebt
    const currentAccount = macro.indicators.currentAccountBalance
    return [
      `ข้อมูลมหภาคล่าสุด (${macro.periodLabel}):`,
      `- GDP ประเทศไทย ${formatPercent(gdp.value)} (${gdp.periodLabel ?? `ปี ${Number(gdp.year) + 543}`})`,
      `- การบริโภคภาคครัวเรือน ${formatPercent(consumption.value)} (${consumption.periodLabel ?? `ปี ${Number(consumption.year) + 543}`})`,
      `- เงินเฟ้อ CPI ${formatPercent(cpi.value)} (${cpi.periodLabel ?? `ปี ${Number(cpi.year) + 543}`})`,
      `- อัตราการว่างงาน ${formatPercent(unemployment.value)} (${unemployment.periodLabel ?? `ปี ${Number(unemployment.year) + 543}`})`,
      `- หนี้ภาครัฐ ${formatPercent(debt.value)} ของ GDP (${debt.periodLabel ?? `ปี ${Number(debt.year) + 543}`})`,
      `- บัญชีเดินสะพัด ${formatPercent(currentAccount.value)} ของ GDP (${currentAccount.periodLabel ?? `ปี ${Number(currentAccount.year) + 543}`})`,
    ].join('\n')
  } catch {
    return 'ไม่สามารถดึงข้อมูลมหภาคจาก IMF / World Bank / NSO ได้ในขณะนี้'
  }
}

type SourceSnapshot = {
  name: string
  fileName: string
  typeLabel: string
  rowCount: number
  rows: Record<string, string | number>[]
}

async function loadSourceSnapshots(userId: string, industry: string, perSource = 6): Promise<SourceSnapshot[]> {
  const sources = (await listSources(userId))
    .filter((source) => !source.isDemo && source.industryId === industry)
    .slice(0, 5)
  const snapshots: SourceSnapshot[] = []
  for (const source of sources) {
    const rows = (await db
      .query<{ payload_json: string }>('SELECT payload_json FROM data_rows WHERE source_id = ? ORDER BY row_index DESC LIMIT ?')
      .all(source.id, perSource))
      .map((row) => {
        try {
          return JSON.parse(row.payload_json) as Record<string, string | number>
        } catch {
          return {}
        }
      })
      .filter((row) => Object.keys(row).length > 0)
    snapshots.push({
      name: source.name,
      fileName: source.fileName,
      typeLabel: source.typeLabel,
      rowCount: source.rowCount,
      rows,
    })
  }
  return snapshots
}

function formatSnapshots(snapshots: SourceSnapshot[]): string {
  const parts = snapshots
    .filter((snapshot) => snapshot.rows.length > 0)
    .map((snapshot) => {
      const columns = Object.keys(snapshot.rows[0])
      const lines = snapshot.rows.map((row) =>
        columns.map((column) => String(row[column] ?? '').slice(0, 48)).join(' | '),
      )
      const header = `[${snapshot.name} — ${snapshot.fileName} · ${snapshot.rowCount} แถว (ตัวอย่าง ${snapshot.rows.length})]`
      return [header, columns.join(' | '), ...lines].join('\n')
    })
  return parts.join('\n\n')
}

async function buildSystemPrompt(userId: string, context: ChatContext): Promise<string> {
  const resolvedIndustry = await industryWithData(userId, context.industry)
  const summary = await getDashboard(userId, '6m', resolvedIndustry)
  const profile = await profileForUser(userId, resolvedIndustry)
  const business = await getBusiness(userId)
  const sources = await listSources(userId)
  const snapshots = await loadSourceSnapshots(userId, resolvedIndustry)
  const agents = await loadAgents(userId, context.agentIds ?? [])
  const specialist = context.specialistRole ?? 'general'
  const macro = await maybeMacroContext(context.question)

  const answerLanguage = context.language === 'en' ? 'en' : 'th'
  const sections: string[] = [
    answerLanguage === 'en'
      ? 'You are ROOKAR, a business analyst assistant for Thai SMEs. Always answer in English.'
      : 'คุณคือ ROOKAR ผู้ช่วยวิเคราะห์ธุรกิจสำหรับ SME ไทย ตอบเป็นภาษาไทยเสมอ',
    answerLanguage === 'en'
      ? 'Use only the data provided below or data returned by tools. Never invent numbers. If data is insufficient, say so clearly.'
      : 'ใช้ข้อมูลที่ให้ด้านล่างเป็นหลัก ห้ามแต่งตัวเลขขึ้นเอง หากข้อมูลไม่พอให้บอกตรง ๆ ว่าไม่มีข้อมูลส่วนนั้น',
    'ใช้ข้อมูลที่ให้ด้านล่างเป็นหลัก ห้ามแต่งตัวเลขขึ้นเอง หากข้อมูลไม่พอให้บอกตรง ๆ ว่าไม่มีข้อมูลส่วนนั้น',
    'ตอบกระชับ เป็นข้อ ๆ ใส่ตัวเลขที่เกี่ยวข้อง และปิดท้ายด้วยขั้นตอนที่ทำต่อได้จริง',
    'หากเป็นการคาดการณ์หรือประมาณการ ต้องระบุว่าเป็นการประมาณ ไม่ใช่การรับประกันผลลัพธ์',
    'คุณมี tools สำหรับดึงข้อมูลจริงจากระบบ (สรุปธุรกิจ, ไฟล์ข้อมูล, เศรษฐกิจมหภาค, เศรษฐกิจอุตสาหกรรม, การเปรียบเทียบ, ตรวจความพร้อมของข้อมูล) ให้เรียก tool ทุกครั้งที่ต้องใช้ตัวเลขหรือข้อมูลล่าสุด ห้ามเดาตัวเลขเอง',
    'ก่อนตอบคำถามเชิงวางแผนธุรกิจ การตั้งราคา เมนู กลยุทธ์ หรือการวิเคราะห์ต้นทุน ให้เรียก check_data_readiness ก่อนเสมอ โดยเลือก task ให้ตรง (pricing, cost_analysis, market_analysis, cashflow)',
    'ถ้า check_data_readiness คืน ready=false ห้ามสร้างแผนหรือตอบคำถามหลัก ให้ตอบเพียงคำถามที่จำเป็นเพื่อขอข้อมูลที่ขาด (ใช้ questions จาก tool ไม่เกิน 5 ข้อ) พร้อมบอกว่าขาดอะไรและเพราะอะไรจึงยังวิเคราะห์ไม่ได้',
    'ห้ามใช้ค่าที่ขาดเป็น 0 หรือสมมติตัวเลขขึ้นมาแทนข้อมูลจริง และต้องแจ้งข้อจำกัดของข้อมูลอย่างตรงไปตรงมา',
  ]

  sections.push(
    [
      '=== ข้อมูลธุรกิจ ===',
      `อุตสาหกรรม: ${profile.label}`,
      `ชื่อธุรกิจ: ${business?.name ?? 'ยังไม่ได้ระบุ'}`,
      `ประเภทธุรกิจ: ${business?.typeLabel ?? profile.label}`,
      `จำนวนพนักงาน: ${business?.employees || 'ไม่ระบุ'}`,
      `ช่วงรายได้ต่อปี: ${business?.revenueRange || 'ไม่ระบุ'}`,
      `เป้าหมายที่เจ้าของเลือก: ${business?.goals?.length ? business.goals.join(', ') : 'ไม่ระบุ'}`,
    ].join('\n'),
  )

  if (summary) {
    const costLines = summary.costBreakdown
      .map((item) => `- ${item.label}: ${formatCurrency(item.value)} (${item.share}%)`)
      .join('\n')
    const seriesLines = summary.series
      .map((point) => `- ${point.label}: รายได้ ${formatCurrency(point.revenue)}, กำไร ${formatCurrency(point.profit)}`)
      .join('\n')
    sections.push(
      [
        `=== ข้อมูลการเงิน 6 เดือนล่าสุด (${summary.rangeLabel}) ===`,
        `รายได้รวม: ${formatCurrency(summary.revenue)} (${summary.revenueDelta >= 0 ? '+' : ''}${summary.revenueDelta}%)`,
        `ต้นทุนรวม: ${formatCurrency(summary.cost)} (${summary.costDelta >= 0 ? '+' : ''}${summary.costDelta}%)`,
        `กำไรสุทธิ: ${formatCurrency(summary.profit)} (${summary.profitDelta >= 0 ? '+' : ''}${summary.profitDelta}%)`,
        `อัตรากำไร: ${formatPercent(summary.margin)}`,
        'โครงสร้างต้นทุน:',
        costLines,
        'รายเดือน:',
        seriesLines,
      ].join('\n'),
    )
  } else {
    sections.push('=== ข้อมูลการเงิน ===\nยังไม่มีข้อมูลที่นำเข้า ผู้ใช้ควรเริ่มนำเข้าไฟล์ CSV ที่หน้าแหล่งข้อมูล')
  }

  if (sources.length > 0) {
    sections.push(
      [
        '=== แหล่งข้อมูลที่เชื่อมต่อ ===',
        ...sources.map((source) => `- ${source.name} (${source.typeLabel}) ${source.rowCount} แถว`),
      ].join('\n'),
    )
  }

  const snapshotText = formatSnapshots(snapshots)
  if (snapshotText) {
    sections.push(
      [
        '=== ตัวอย่างแถวข้อมูลจริงจากไฟล์ (ใช้วิเคราะห์ได้) ===',
        snapshotText,
        'หมายเหตุ: ตัวอย่างนี้เป็นบางแถวล่าสุด ส่วนตัวเลขสรุปด้านบนคำนวณจากทุกแถวในระบบ',
      ].join('\n\n'),
    )
  }

  sections.push(`=== บทบาทผู้เชี่ยวชาญที่เลือก ===\n${specialistInstructions[specialist] ?? specialistInstructions.general}`)

  if (agents.length > 0) {
    sections.push(
      [
        '=== ทีม Agent ที่ผู้ใช้เปิดใช้งาน ===',
        ...agents.map((agent) => `[${agent.name} — ${agent.role}]\n${agent.systemPrompt}`),
        'ให้ผสานมุมมองของ Agent เหล่านี้ แต่ต้องไม่ขัดกับข้อมูลจริง และต้องตอบเป็นคำตอบเดียวที่ cohesive',
      ].join('\n\n'),
    )
  }

  if (macro) sections.push(`=== บริบทเศรษฐกิจมหภาค ===\n${macro}`)

  if (context.attachment?.content) {
    sections.push(
      `=== ไฟล์แนบ: ${context.attachment.name} ===\n${truncate(context.attachment.content, 12000)}`,
    )
  }

  return sections.join('\n\n')
}

const OPENAI_COMPATIBLE_PROVIDERS = new Set(['openai', 'opencode', 'opencode-go'])

function mockProviderEnabled() {
  return !OPENAI_COMPATIBLE_PROVIDERS.has(env.aiProvider) || !env.openaiApiKey
}

async function* streamOpenAi(
  messages: { role: string; content: string }[],
  signal?: AbortSignal,
  sessionId?: string,
): AsyncGenerator<AiStreamEvent> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60_000)
  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  try {
    const response = await fetch(`${env.openaiBaseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.openaiApiKey}`,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        'User-Agent': env.openaiUserAgent,
        ...(sessionId ? { 'x-opencode-session': sessionId } : {}),
      },
      body: JSON.stringify({
        model: env.openaiModel,
        messages,
        stream: true,
        temperature: 0.4,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      throw new Error(`AI provider ตอบกลับ ${response.status}${detail ? `: ${detail.slice(0, 300)}` : ''}`)
    }
    if (!response.body) throw new Error('AI provider ไม่ได้ส่งข้อมูลกลับมา')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const rawLine of lines) {
        const line = rawLine.trim()
        if (!line.startsWith('data:')) continue
        const payload = line.slice(5).trim()
        if (!payload || payload === '[DONE]') continue
        try {
          const parsed = JSON.parse(payload) as {
            error?: { message?: string }
            choices?: { delta?: { content?: string } }[]
          }
          if (parsed.error?.message) throw new Error(parsed.error.message)
          const token = parsed.choices?.[0]?.delta?.content
          if (typeof token === 'string' && token) yield { type: 'token', value: token }
        } catch (error) {
          if (error instanceof SyntaxError) continue
          throw error
        }
      }
    }
  } finally {
    clearTimeout(timeout)
  }
}

export async function buildAnswer(userId: string, question: string, industry?: string | null): Promise<Answer> {
  const summary = await getDashboard(userId, '6m', industry)
  const profile = await profileForUser(userId, industry)
  if (!summary) {
    return {
      content: `ยังไม่มีข้อมูลเพียงพอสำหรับวิเคราะห์ครับ\n\nเริ่มจากนำเข้าไฟล์ CSV อย่างน้อย 1 ไฟล์ที่หน้า “แหล่งข้อมูล” หรือกด “นำเข้าข้อมูล” แล้วผมจะสรุปยอดขาย ต้นทุน และกำไรให้ทันที`,
      citations: [],
    }
  }

  const normalized = question.toLowerCase()
  const mainCost = topCost(summary)
  const citations = await sourceCitations(userId, summary)
  const focus = profile.focusPoints.map((point) => `• ${point}`).join('\n')
  const quickPrompts = profile.sample.quickPrompts.map((prompt) => `• ${prompt}`).join('\n')

  if (normalized.includes('action plan') || normalized.includes('แผนปฏิบัติ') || normalized.includes('30 วัน') || normalized.includes('แผนงาน')) {
    return {
      content: `แผนปฏิบัติการ 30 วันสำหรับ${profile.label}:

• สัปดาห์ที่ 1: ตรวจสอบ${mainCost?.label ?? 'ต้นทุนหลัก'} ซึ่งคิดเป็น ${mainCost?.share ?? 0}% ของต้นทุนรวม
• สัปดาห์ที่ 2: ตั้งเป้าลดต้นทุนหมวดนี้ 3–5% โดยไม่กระทบคุณภาพ
• สัปดาห์ที่ 3: วัดผลรายได้และกำไรเทียบช่วงก่อนหน้า
• สัปดาห์ที่ 4: สรุปผลและปรับแผนจากตัวเลขจริง

ตัวชี้วัดที่ควรติดตาม:
${focus}`,
      citations,
    }
  }

  if (normalized.includes('จุดคุ้มทุน') || normalized.includes('break-even') || normalized.includes('ขั้นต่ำ')) {
    const cost = summary.cost
    const marginRate = summary.margin / 100
    const contribution = Math.max(0.05, marginRate)
    const breakEven = cost / contribution
    return {
      content: `การวิเคราะห์จุดคุ้มทุนจากข้อมูล 6 เดือนล่าสุด:

• ต้นทุนรวม ${formatCurrency(cost)}
• อัตรากำไรปัจจุบัน ${formatPercent(summary.margin)}
• ยอดขายจุดคุ้มทุนโดยประมาณ ${formatCurrency(breakEven)}

ตัวเลขนี้คำนวณจากข้อมูลที่นำเข้าและเป็นเพียงการประมาณ ควรใช้ร่วมกับต้นทุนคงที่จริงของธุรกิจครับ`,
      citations,
    }
  }

  if (normalized.includes('gdp') || normalized.includes('เศรษฐกิจ') || normalized.includes('มหาภาค') || normalized.includes('ตลาด')) {
    try {
      const macro = await getMacroBenchmark()
      const gdp = macro.indicators.gdpGrowth
      const cpi = macro.indicators.cpiInflation
      return {
        content: `ภาพรวมเศรษฐกิจมหภาคล่าสุด (${macro.periodLabel}):

• GDP ประเทศไทย ${formatPercent(gdp.value)} (${gdp.periodLabel ?? `ปี ${Number(gdp.year) + 543}`})
• เงินเฟ้อ CPI ${formatPercent(cpi.value)} (${cpi.periodLabel ?? `ปี ${Number(cpi.year) + 543}`})
• รายได้ธุรกิจ 6 เดือนล่าสุด ${formatCurrency(summary.revenue)} (${summary.revenueDelta >= 0 ? '+' : ''}${summary.revenueDelta}%)
• กำไรสุทธิ ${formatCurrency(summary.profit)} (${formatPercent(summary.margin)})

ข้อสังเกต: เปรียบเทียบการเติบโตของธุรกิจกับ GDP และเงินเฟ้อเพื่อดูว่ากำไรจริงเพิ่มขึ้นหรือเพียงตามราคาสินค้า`,
        citations,
      }
    } catch {
      return {
        content: `ยังดึงข้อมูล World Bank ไม่สำเร็จในขณะนี้ แต่ภาพรวมธุรกิจ 6 เดือนล่าสุดคือ:\n\n• รายได้ ${formatCurrency(summary.revenue)}\n• กำไร ${formatCurrency(summary.profit)} (${formatPercent(summary.margin)})\n• ต้นทุนหลัก: ${mainCost?.label ?? '—'} (${mainCost?.share ?? 0}%)`,
        citations,
      }
    }
  }

  if (normalized.includes('ต้นทุน') || normalized.includes('cost') || normalized.includes('กำไร') || normalized.includes('margin')) {
    return {
      content: `ภาพรวมต้นทุนและกำไรของ${profile.label}:

• รายได้ 6 เดือนล่าสุด ${formatCurrency(summary.revenue)}
• ต้นทุนรวม ${formatCurrency(summary.cost)}
• กำไรสุทธิ ${formatCurrency(summary.profit)} (${formatPercent(summary.margin)})
• ต้นทุนก้อนใหญ่ที่สุด: ${mainCost?.label ?? '—'} ${mainCost?.share ?? 0}%

จุดที่ควรจับตา:
${focus}`,
      citations,
    }
  }

  if (normalized.includes('ยอดขาย') || normalized.includes('รายได้') || normalized.includes('sales')) {
    return {
      content: `รายได้ 6 เดือนล่าสุดของ${profile.label}อยู่ที่ ${formatCurrency(summary.revenue)} เติบโต ${summary.revenueDelta >= 0 ? '+' : ''}${summary.revenueDelta}% จากช่วงก่อน

• กำไรสุทธิ ${formatCurrency(summary.profit)}
• อัตรากำไร ${formatPercent(summary.margin)}
• ต้นทุนหลัก: ${mainCost?.label ?? '—'} (${mainCost?.share ?? 0}%)

คำถามที่ถามต่อได้:
${quickPrompts}`,
      citations,
    }
  }

  if (normalized.includes('ทำนาย') || normalized.includes('แนวโน้ม') || normalized.includes('คาด')) {
    const last = summary.series.at(-1)
    const previous = summary.series.at(-2)
    const growth = last && previous && previous.revenue > 0 ? ((last.revenue - previous.revenue) / previous.revenue) * 100 : 0
    return {
      content: `แนวโน้มจากข้อมูล 6 เดือนล่าสุด:

• เดือนล่าสุดรายได้ ${formatCurrency(last?.revenue ?? 0)}
• เติบโตจากเดือนก่อน ${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%
• กำไรเดือนล่าสุด ${formatCurrency(last?.profit ?? 0)}

นี่เป็นการประมาณจากข้อมูลในระบบ ไม่ใช่การรับประกันผลลัพธ์ ควรใช้ร่วมกับแผนธุรกิจจริงครับ`,
      citations,
    }
  }

  return {
    content: `ภาพรวม${profile.label}จากข้อมูลที่นำเข้า:

• รายได้ 6 เดือนล่าสุด ${formatCurrency(summary.revenue)} (${summary.revenueDelta >= 0 ? '+' : ''}${summary.revenueDelta}%)
• กำไรสุทธิ ${formatCurrency(summary.profit)} (${formatPercent(summary.margin)})
• ต้นทุนรวม ${formatCurrency(summary.cost)}
• ต้นทุนหลัก: ${mainCost?.label ?? '—'} (${mainCost?.share ?? 0}%)

จุดที่ควรจับตา:
${focus}`,
    citations,
  }
}

export async function* streamAnswer(userId: string, context: ChatContext): AsyncGenerator<AiStreamEvent> {
  const resolvedIndustry = await industryWithData(userId, context.industry)
  const resolvedContext: ChatContext = { ...context, industry: resolvedIndustry }
  const summary = await getDashboard(userId, '6m', resolvedIndustry)
  const citations = summary ? await sourceCitations(userId, summary) : []

  if (mockProviderEnabled()) {
    const answer = await buildAnswer(userId, context.question, resolvedIndustry)
    const prefix: string[] = []
    if (context.specialistRole && context.specialistRole !== 'general') {
      prefix.push(`โหมดผู้เชี่ยวชาญ: ${specialistLabel(context.specialistRole)}`)
    }
    const agents = await loadAgents(userId, context.agentIds ?? [])
    if (agents.length > 0) {
      prefix.push(`ทีม Agent ที่เกี่ยวข้อง: ${agents.map((agent) => `${agent.name} (${agent.role})`).join(', ')}`)
    }
    if (context.attachment) {
      prefix.push(summarizeAttachment(context.attachment))
    }
    const content = prefix.length > 0 ? `${prefix.join('\n\n')}\n\n${answer.content}` : answer.content
    const chunks = content.match(/.{1,6}/gs) ?? [content]
    for (const chunk of chunks) {
      if (context.signal?.aborted) return
      await new Promise((resolve) => setTimeout(resolve, 12 + Math.random() * 16))
      if (context.signal?.aborted) return
      yield { type: 'token', value: chunk }
    }
    for (const citation of answer.citations) {
      yield { type: 'citation', citation }
    }
    yield { type: 'done' }
    return
  }

  const systemPrompt = await buildSystemPrompt(userId, resolvedContext)
  const history = (context.history ?? [])
    .filter((entry) => entry.content.trim())
    .slice(-12)
    .map((entry) => ({
      role: entry.role,
      content: truncate(entry.content.trim(), 2000),
    }))

  const conversationKey = context.conversationId
    ?.replace(/^ses_/, '')
    .replace(/[^A-Za-z0-9_-]/g, '')
    .slice(0, 80)
  const sessionId = conversationKey ? `ses_user_${userId}_${conversationKey}` : `ses_user_${userId}`

  for await (const event of runToolCallingAgent({
    systemPrompt,
    question: context.question,
    history,
    context: { userId, industry: resolvedIndustry },
    sessionId,
    signal: context.signal,
  })) {
    yield event
  }
  for (const citation of citations) {
    yield { type: 'citation', citation }
  }
  yield { type: 'done' }
}
