import { z } from 'zod'
import { getBusiness } from '../auth'
import { db } from '../db'
import { getDashboard } from '../services/dashboard'
import { getIndustryEconomics } from '../services/industryEconomics'
import { getMacroBenchmark } from '../services/macro'
import { getSource, industryWithData, listSources } from '../services/sources'
import { getIndustryProfile } from '../../src/lib/industries'
import type { Citation, DataSource } from '../../src/types'

export type ToolContext = {
  userId: string
  industry?: string | null
}

export type ToolExecution = {
  summary: string
  data?: unknown
  citations?: Citation[]
  error?: boolean
}

export type AgentTool = {
  name: string
  label: string
  description: string
  parameters: Record<string, unknown>
  execute: (args: Record<string, unknown>, context: ToolContext) => Promise<ToolExecution>
}

const range = z.enum(['3m', '6m', '12m']).catch('6m')
const industry = z.string().trim().min(1).optional()

const rangeParam = {
  type: 'string',
  enum: ['3m', '6m', '12m'],
  description: 'ช่วงเวลาที่ต้องการวิเคราะห์',
}

const industryParam = {
  type: 'string',
  description: 'รหัสอุตสาหกรรม เช่น fnb, logistics, healthcare (ถ้าไม่ระบุจะใช้บริบทปัจจุบัน)',
}

function errorResult(message: string): ToolExecution {
  return { summary: message, error: true }
}

function forModel(result: ToolExecution) {
  return JSON.stringify({
    summary: result.summary,
    data: result.data ?? null,
    error: result.error ?? false,
  }).slice(0, 12000)
}

function normalizeColumnKey(value: string) {
  return value.toLowerCase().replace(/\s+/g, '')
}

async function sourceColumnKeys(sourceIds: string[]) {
  const keys = new Set<string>()
  for (const sourceId of sourceIds) {
    const rows = await db
      .query<{ payload_json: string }>('SELECT payload_json FROM data_rows WHERE source_id = ? ORDER BY row_index DESC LIMIT 15')
      .all(sourceId)
    for (const row of rows) {
      try {
        const payload = JSON.parse(row.payload_json) as Record<string, unknown>
        for (const key of Object.keys(payload)) keys.add(normalizeColumnKey(key))
      } catch {
        // Skip malformed rows.
      }
    }
  }
  return keys
}

function hasAnyColumn(keys: Set<string>, candidates: string[]) {
  for (const key of keys) {
    if (candidates.some((candidate) => key.includes(candidate))) return true
  }
  return false
}

async function countDistinctMonths(sourceIds: string[]) {
  if (sourceIds.length === 0) return 0
  const placeholders = sourceIds.map(() => '?').join(',')
  const row = await db
    .query<{ months: number }>(
      `SELECT COUNT(DISTINCT substr(occurred_on, 1, 7)) AS months
       FROM data_rows
       WHERE occurred_on IS NOT NULL AND source_id IN (${placeholders})`,
    )
    .get(...sourceIds)
  return row?.months ?? 0
}

type ReadinessTask = 'pricing' | 'cost_analysis' | 'market_analysis' | 'cashflow' | 'general'

function assessReadiness(task: ReadinessTask, sources: DataSource[], months: number, columns: Set<string>) {
  const hasSales = sources.some((source) => source.type === 'sales')
  const hasMaterials = sources.some((source) => source.type === 'materials')
  const hasLabor = sources.some((source) => source.type === 'labor')
  const hasExpenses = sources.some((source) => source.type === 'expenses')
  const hasOrders = hasAnyColumn(columns, ['ออเดอร์', 'order', 'บิล', 'bill', 'transaction'])
  const hasMenu = hasAnyColumn(columns, ['เมนู', 'menu', 'สินค้า', 'product', 'sku', 'item'])
  const hasUnitPrice = hasAnyColumn(columns, ['ราคาต่อหน่วย', 'unitprice', 'price', 'ราคาขาย'])
  const hasUnitCost = hasAnyColumn(columns, ['ต้นทุนต่อหน่วย', 'unitcost', 'ต้นทุน/หน่วย', 'foodcost'])

  const missing: string[] = []
  const questions: string[] = []

  if (!hasSales) {
    missing.push('ยอดขาย')
    questions.push('มียอดขายรายวันหรือรายเดือนของร้านไหม (วันที่ + ยอดขาย + ช่องทาง)')
  }
  if (task !== 'market_analysis') {
    if (!hasMaterials) {
      missing.push('ต้นทุนวัตถุดิบ')
      questions.push('มีไฟล์ต้นทุนวัตถุดิบ/บรรจุภัณฑ์แยกจากค่าใช้จ่ายอื่นไหม')
    }
    if (!hasLabor) {
      missing.push('ค่าแรง')
      questions.push('มีข้อมูลค่าแรง/เงินเดือน/OT ของพนักงานไหม')
    }
  }
  if ((task === 'cost_analysis' || task === 'cashflow') && !hasExpenses) {
    missing.push('ค่าใช้จ่ายดำเนินงาน')
    questions.push('มีค่าใช้จ่ายคงที่ เช่น ค่าเช่า ค่าน้ำค่าไฟ ไหม')
  }
  if (task === 'pricing') {
    if (!hasOrders) {
      missing.push('จำนวนออเดอร์/บิล')
      questions.push('ไฟล์ยอดขายมีคอลัมน์จำนวนออเดอร์หรือจำนวนบิลต่อวันไหม')
    }
    if (!hasMenu) {
      missing.push('รายการเมนู/สินค้า')
      questions.push('มีรายชื่อเมนู/สินค้าที่ขายพร้อมราคาต่อหน่วยไหม')
    }
    if (!hasUnitCost) {
      missing.push('ต้นทุนต่อเมนู')
      questions.push('มีต้นทุนวัตถุดิบต่อเมนูหรือสูตรต้นทุนต่อจานไหม')
    }
    if (!hasUnitPrice) {
      missing.push('ราคาต่อหน่วย')
      questions.push('มีราคาขายต่อเมนู/ต่อหน่วยไหม')
    }
  }
  if (months < 3) {
    missing.push('ข้อมูลย้อนหลัง 3 เดือน')
    questions.push(`ข้อมูลปัจจุบันครอบคลุม ${months} เดือน — มีข้อมูลย้อนหลังอย่างน้อย 3 เดือนไหม`)
  }

  const uniqueMissing = [...new Set(missing)]
  return {
    ready: uniqueMissing.length === 0,
    missing: uniqueMissing,
    questions: questions.slice(0, 5),
    signals: {
      hasSales,
      hasMaterials,
      hasLabor,
      hasExpenses,
      hasOrders,
      hasMenu,
      hasUnitPrice,
      hasUnitCost,
      months,
    },
  }
}

export const AGENT_TOOLS: AgentTool[] = [
  {
    name: 'get_business_profile',
    label: 'ข้อมูลธุรกิจ',
    description: 'ดึงข้อมูลโปรไฟล์ธุรกิจของผู้ใช้ (ชื่อ ประเภท พนักงาน รายได้ และเป้าหมาย)',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
    async execute(_args, context) {
      const business = await getBusiness(context.userId)
      if (!business) return errorResult('ยังไม่มีข้อมูลโปรไฟล์ธุรกิจ')
      return {
        summary: `${business.name} · ${business.typeLabel} · พนักงาน ${business.employees || 'ไม่ระบุ'}`,
        data: business,
      }
    },
  },
  {
    name: 'list_data_sources',
    label: 'รายการแหล่งข้อมูล',
    description: 'ดึงรายการไฟล์ข้อมูลที่ผู้ใช้นำเข้า พร้อมจำนวนแถว คุณภาพ และอุตสาหกรรมที่จัดไว้',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
    async execute(_args, context) {
      const sources = (await listSources(context.userId))
        .filter((source) => !source.isDemo)
        .map((source) => ({
          id: source.id,
          name: source.name,
          type: source.type,
          typeLabel: source.typeLabel,
          rowCount: source.rowCount,
          quality: source.quality,
          industryId: source.industryId ?? null,
          fileName: source.fileName,
          period: source.period,
          updatedAt: source.updatedAt,
        }))
      return {
        summary: `พบ ${sources.length} แหล่งข้อมูล รวม ${sources.reduce((sum, source) => sum + source.rowCount, 0)} แถว`,
        data: sources,
      }
    },
  },
  {
    name: 'get_source_rows',
    label: 'ตัวอย่างข้อมูลในไฟล์',
    description: 'ดึงตัวอย่างแถวข้อมูลจริงจากไฟล์ที่ผู้ใช้เลือก (สูงสุด 20 แถวล่าสุด)',
    parameters: {
      type: 'object',
      properties: {
        sourceId: { type: 'string', description: 'id ของแหล่งข้อมูลจาก list_data_sources' },
        limit: { type: 'number', minimum: 1, maximum: 20, description: 'จำนวนแถวที่ต้องการ' },
      },
      required: ['sourceId'],
      additionalProperties: false,
    },
    async execute(args, context) {
      const parsed = z.object({ sourceId: z.string().min(1), limit: z.number().min(1).max(20).catch(8) }).safeParse(args)
      if (!parsed.success) return errorResult('พารามิเตอร์ของ get_source_rows ไม่ถูกต้อง')
      const source = await getSource(context.userId, parsed.data.sourceId)
      if (!source) return errorResult('ไม่พบแหล่งข้อมูลนี้ในบัญชีของคุณ')
      const rows = (await db
        .query<{ payload_json: string }>('SELECT payload_json FROM data_rows WHERE source_id = ? ORDER BY row_index DESC LIMIT ?')
        .all(source.id, parsed.data.limit))
        .map((row) => {
          try {
            return JSON.parse(row.payload_json) as Record<string, string | number>
          } catch {
            return {}
          }
        })
      return {
        summary: `อ่าน ${rows.length} แถวล่าสุดจาก ${source.name} (${source.rowCount} แถวทั้งหมด)`,
        data: { source: { id: source.id, name: source.name, type: source.typeLabel, fileName: source.fileName }, rows },
        citations: [{
          id: `cit_${source.id}`,
          title: source.name,
          period: source.period,
          value: `${source.rowCount} แถว`,
          source: source.fileName,
        }],
      }
    },
  },
  {
    name: 'get_dashboard_summary',
    label: 'สรุปภาพรวมธุรกิจ',
    description: 'ดึงสรุปรายได้ ต้นทุน กำไร อัตรากำไร โครงสร้างต้นทุน และรายได้ตาม Segment ของช่วงเวลาที่เลือก',
    parameters: {
      type: 'object',
      properties: { range: rangeParam, industry: industryParam },
      additionalProperties: false,
    },
    async execute(args, context) {
      const parsed = z.object({ range, industry }).safeParse(args)
      if (!parsed.success) return errorResult('พารามิเตอร์ของ get_dashboard_summary ไม่ถูกต้อง')
      const summary = await getDashboard(context.userId, parsed.data.range, parsed.data.industry ?? context.industry)
      if (!summary) {
        return errorResult('ยังไม่มีข้อมูลที่นำเข้าเพียงพอสำหรับสรุปภาพรวมธุรกิจ')
      }
      return {
        summary: `รายได้ ${summary.revenue.toLocaleString('th-TH')} บาท · กำไร ${summary.profit.toLocaleString('th-TH')} บาท · margin ${summary.margin.toFixed(1)}%`,
        data: {
          hasSales: summary.hasSales ?? true,
          hasCost: summary.hasCost ?? true,
          rangeLabel: summary.rangeLabel,
          revenue: summary.revenue,
          profit: summary.profit,
          cost: summary.cost,
          margin: Number(summary.margin.toFixed(1)),
          revenueDelta: summary.revenueDelta,
          profitDelta: summary.profitDelta,
          costDelta: summary.costDelta,
          series: summary.series,
          costBreakdown: summary.costBreakdown,
          segments: summary.segments ?? [],
          costSegments: summary.costSegments ?? [],
          industry: summary.industry ?? null,
        },
      }
    },
  },
  {
    name: 'get_macro_benchmark',
    label: 'เศรษฐกิจมหภาคประเทศ',
    description: 'ดึง GDP ประเทศไทย เงินเฟ้อ CPI การบริโภคครัวเรือน การว่างงาน หนี้ภาครัฐ และบัญชีเดินสะพัดล่าสุด',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
    async execute() {
      try {
        const macro = await getMacroBenchmark()
        return {
          summary: `GDP ${macro.indicators.gdpGrowth.value.toFixed(1)}% · CPI ${macro.indicators.cpiInflation.value.toFixed(1)}% · ว่างงาน ${macro.indicators.unemploymentRate.value.toFixed(1)}%`,
          data: {
            source: macro.source,
            periodLabel: macro.periodLabel,
            indicators: macro.indicators,
            lastUpdated: macro.lastUpdated,
            stale: macro.stale ?? false,
          },
          citations: [{
            id: 'cit_macro',
            title: 'Macro Benchmark',
            period: macro.periodLabel,
            value: `GDP ${macro.indicators.gdpGrowth.value}%`,
            source: macro.source,
          }],
        }
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'ดึงข้อมูลมหภาคไม่สำเร็จ')
      }
    },
  },
  {
    name: 'get_industry_economics',
    label: 'เศรษฐกิจของอุตสาหกรรม',
    description: 'ดึงตัวชี้วัดเศรษฐกิจที่สัมพันธ์กับอุตสาหกรรมที่เลือก เช่น GDP ภาคบริการ การบริโภค เงินเฟ้อ รายจ่ายสุขภาพ',
    parameters: {
      type: 'object',
      properties: { industry: industryParam },
      additionalProperties: false,
    },
    async execute(args, context) {
      const parsed = z.object({ industry }).safeParse(args)
      if (!parsed.success) return errorResult('พารามิเตอร์ของ get_industry_economics ไม่ถูกต้อง')
      try {
        const economics = await getIndustryEconomics(parsed.data.industry ?? context.industry)
        return {
          summary: economics.indicators
            .map((indicator) => `${indicator.label} ${indicator.value}${indicator.unit === 'percent' ? '%' : ' ปี'}`)
            .join(' · '),
          data: economics,
          citations: [{
            id: 'cit_industry_economics',
            title: economics.label,
            period: 'ข้อมูลล่าสุด',
            value: `${economics.indicators.length} indicators`,
            source: economics.source,
          }],
        }
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'ดึงข้อมูลเศรษฐกิจอุตสาหกรรมไม่สำเร็จ')
      }
    },
  },
  {
    name: 'compare_business_to_macro',
    label: 'เทียบธุรกิจกับเศรษฐกิจ',
    description: 'เปรียบเทียบการเติบโตของรายได้ธุรกิจกับ GDP ประเทศไทย และบริบทเงินเฟ้อ/การว่างงาน',
    parameters: {
      type: 'object',
      properties: { range: rangeParam, industry: industryParam },
      additionalProperties: false,
    },
    async execute(args, context) {
      const parsed = z.object({ range, industry }).safeParse(args)
      if (!parsed.success) return errorResult('พารามิเตอร์ของ compare_business_to_macro ไม่ถูกต้อง')
      const summary = await getDashboard(context.userId, parsed.data.range, parsed.data.industry ?? context.industry)
      if (!summary) return errorResult('ยังไม่มีข้อมูลธุรกิจพอสำหรับการเปรียบเทียบ')
      try {
        const macro = await getMacroBenchmark()
        const gdp = macro.indicators.gdpGrowth.value
        const cpi = macro.indicators.cpiInflation.value
        const diff = Number((summary.revenueDelta - gdp).toFixed(1))
        return {
          summary: `รายได้ธุรกิจ ${summary.revenueDelta >= 0 ? '+' : ''}${summary.revenueDelta}% เทียบ GDP ${gdp}% (${diff >= 0 ? 'สูงกว่า' : 'ต่ำกว่า'} ${Math.abs(diff)} จุด) · เงินเฟ้อ ${cpi}%`,
          data: {
            business: {
              revenueGrowth: summary.revenueDelta,
              margin: Number(summary.margin.toFixed(1)),
              revenue: summary.revenue,
              profit: summary.profit,
            },
            macro: {
              gdpGrowth: gdp,
              inflation: cpi,
              unemployment: macro.indicators.unemploymentRate.value,
            },
            differencePoints: diff,
          },
          citations: [{
            id: 'cit_compare_macro',
            title: 'เทียบธุรกิจกับเศรษฐกิจ',
            period: summary.rangeLabel,
            value: `${diff >= 0 ? '+' : ''}${diff} จุด`,
            source: macro.source,
          }],
        }
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'ดึงข้อมูลมหภาคไม่สำเร็จ')
      }
    },
  },
  {
    name: 'check_data_readiness',
    label: 'ตรวจความพร้อมของข้อมูล',
    description: 'ตรวจว่าข้อมูลที่นำเข้ามีเพียงพอสำหรับงานที่ผู้ใช้ขอหรือไม่ (pricing, cost_analysis, market_analysis, cashflow) และสร้างคำถามที่จำเป็นหากข้อมูลยังขาด',
    parameters: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          enum: ['pricing', 'cost_analysis', 'market_analysis', 'cashflow', 'general'],
          description: 'ประเภทงานที่กำลังจะทำ',
        },
        industry: industryParam,
      },
      required: ['task'],
      additionalProperties: false,
    },
    async execute(args, context) {
      const parsed = z
        .object({ task: z.enum(['pricing', 'cost_analysis', 'market_analysis', 'cashflow', 'general']), industry })
        .safeParse(args)
      if (!parsed.success) return errorResult('พารามิเตอร์ของ check_data_readiness ไม่ถูกต้อง')

      const sources = (await listSources(context.userId)).filter((source) => !source.isDemo)
      const sourceIds = sources.map((source) => source.id)
      const columns = await sourceColumnKeys(sourceIds)
      const months = await countDistinctMonths(sourceIds)
      const readiness = assessReadiness(parsed.data.task, sources, months, columns)
      if (!readiness.ready) {
        return {
          summary: `ข้อมูลยังไม่พร้อม: ขาด ${readiness.missing.join(', ')}`,
          data: { ...readiness, task: parsed.data.task },
        }
      }
      return {
        summary: `ข้อมูลพร้อมสำหรับ ${parsed.data.task} (${months} เดือน)`,
        data: { ...readiness, task: parsed.data.task },
      }
    },
  },
  {
    name: 'get_industry_profile',
    label: 'บริบทอุตสาหกรรม',
    description: 'ดึงคำอธิบายอุตสาหกรรม จุดที่ควรจับตา และคำถามวิเคราะห์ที่แนะนำ',
    parameters: {
      type: 'object',
      properties: { industry: industryParam },
      additionalProperties: false,
    },
    async execute(args, context) {
      const parsed = z.object({ industry }).safeParse(args)
      if (!parsed.success) return errorResult('พารามิเตอร์ของ get_industry_profile ไม่ถูกต้อง')
      const profile = getIndustryProfile(parsed.data.industry ?? context.industry)
      return {
        summary: `${profile.label}: ${profile.focusPoints.slice(0, 3).join(' · ')}`,
        data: {
          id: profile.id,
          label: profile.label,
          description: profile.description,
          focusPoints: profile.focusPoints,
          quickPrompts: profile.sample.quickPrompts,
        },
      }
    },
  },
]

export const TOOL_MAP = new Map(AGENT_TOOLS.map((tool) => [tool.name, tool]))
export const TOOL_SCHEMAS = AGENT_TOOLS.map((tool) => ({
  type: 'function' as const,
  function: {
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  },
}))

export function resolveToolIndustry(context: ToolContext) {
  return industryWithData(context.userId, context.industry)
}

export function serializeToolResult(result: ToolExecution) {
  return forModel(result)
}
