import { startOfMonth, subMonths } from 'date-fns'
import type {
  CostSlice,
  DashboardIndustryMeta,
  DashboardSegment,
  DashboardSummary,
  DataType,
} from '../../src/types'
import { getIndustryProfile, normalizeIndustryId } from '../../src/lib/industries'
import { formatCurrency, formatDelta, formatPercent } from '../../src/lib/format'
import { industryForUser, listSources } from './sources'
import { backfillSourceIndustries } from './industryClassifier'
import type { DataSource } from '../../src/types'
import { db } from '../db'

type Range = '3m' | '6m' | '12m'
type MonthFact = { month: string; type: DataType; label: string | null; amount: number }

function pctChange(from: number, to: number): number {
  if (from === 0) return 0
  return Number((((to - from) / from) * 100).toFixed(1))
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

type DashboardLang = 'th' | 'en'

function monthLabel(date: Date, lang: DashboardLang = 'th') {
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'th-TH', { month: 'short' }).format(date)
}

function monthSequence(count: number) {
  const now = startOfMonth(new Date())
  return Array.from({ length: count }, (_, index) => subMonths(now, count - 1 - index))
}

async function monthFacts(userId: string, sourceIds?: string[]): Promise<MonthFact[]> {
  if (sourceIds && sourceIds.length === 0) return []
  const sourceFilter = sourceIds ? `AND s.id IN (${sourceIds.map(() => '?').join(',')})` : ''
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - 24)
  const cutoffDate = cutoff.toISOString().slice(0, 10)
  const rows = await db
    .query<
      {
        type: DataType
        occurred_on: string
        amount: number
        label: string | null
      }
    >(
      `SELECT s.type AS type, r.occurred_on AS occurred_on, r.amount AS amount, r.label AS label
       FROM data_rows r
       JOIN data_sources s ON s.id = r.source_id
       WHERE s.user_id = ? AND r.occurred_on IS NOT NULL AND r.amount IS NOT NULL AND r.occurred_on >= ? ${sourceFilter}`,
    )
    .all(userId, cutoffDate, ...(sourceIds ?? []))
  return rows.map((row) => ({
    month: row.occurred_on.slice(0, 7),
    type: row.type,
    label: row.label,
    amount: Number(row.amount) || 0,
  }))
}

function buildIndustryMeta(
  userId: string,
  industryId: string,
  sources: DataSource[],
  allSources: DataSource[],
  facts: MonthFact[],
  currentMonths: Set<string>,
): DashboardIndustryMeta {
  const profile = getIndustryProfile(industryId)
  const realSources = sources.filter((source) => !source.isDemo)
  const confidences = realSources
    .map((source) => source.industryConfidence)
    .filter((value): value is number => typeof value === 'number')
  const confidence = confidences.length
    ? Math.round((confidences.reduce((sum, value) => sum + value, 0) / confidences.length) * 100)
    : 0
  const coverageMonths = new Set(
    facts.filter((fact) => currentMonths.has(fact.month)).map((fact) => fact.month),
  ).size
  const unmatchedSources = allSources.filter(
    (source) => !source.isDemo && !source.industryId,
  ).length

  return {
    id: profile.id,
    label: profile.label,
    shortLabel: profile.shortLabel,
    accent: profile.accent,
    sourceCount: sources.length,
    realSourceCount: realSources.length,
    demoSourceCount: sources.length - realSources.length,
    coverageMonths,
    totalMonths: currentMonths.size,
    confidence,
    unmatchedSources,
  }
}

function buildSegments(facts: MonthFact[], currentMonths: Set<string>): DashboardSegment[] {
  const totals = new Map<string, number>()
  for (const fact of facts) {
    if (fact.type !== 'sales' || !currentMonths.has(fact.month)) continue
    const label = fact.label?.trim() || 'ไม่ระบุช่องทาง'
    totals.set(label, (totals.get(label) ?? 0) + fact.amount)
  }
  const total = [...totals.values()].reduce((sum, value) => sum + value, 0)
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value], index) => ({
      key: `segment-${index}`,
      label,
      value,
      share: total === 0 ? 0 : Math.round((value / total) * 100),
    }))
}

function buildCostSegments(facts: MonthFact[], currentMonths: Set<string>): DashboardSegment[] {
  const totals = new Map<string, number>()
  for (const fact of facts) {
    if (fact.type === 'sales' || !currentMonths.has(fact.month)) continue
    const label = fact.label?.trim() || 'ไม่ระบุหมวด'
    totals.set(label, (totals.get(label) ?? 0) + fact.amount)
  }
  const total = [...totals.values()].reduce((sum, value) => sum + value, 0)
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value], index) => ({
      key: `cost-segment-${index}`,
      label,
      value,
      share: total === 0 ? 0 : Math.round((value / total) * 100),
    }))
}

function buildAllIndustryMeta(
  sources: DataSource[],
  allSources: DataSource[],
  facts: MonthFact[],
  currentMonths: Set<string>,
): DashboardIndustryMeta {
  const confidences = sources
    .map((source) => source.industryConfidence)
    .filter((value): value is number => typeof value === 'number')
  const confidence = confidences.length
    ? Math.round((confidences.reduce((sum, value) => sum + value, 0) / confidences.length) * 100)
    : 0
  const coverageMonths = new Set(
    facts.filter((fact) => currentMonths.has(fact.month)).map((fact) => fact.month),
  ).size
  return {
    id: 'all',
    label: 'ทุกอุตสาหกรรม',
    shortLabel: 'All',
    accent: '#18181b',
    sourceCount: sources.length,
    realSourceCount: sources.length,
    demoSourceCount: 0,
    coverageMonths,
    totalMonths: currentMonths.size,
    confidence,
    unmatchedSources: allSources.filter((source) => !source.industryId).length,
  }
}

function buildInsight(
  costBreakdown: CostSlice[],
  metrics: {
    revenue: number
    profit: number
    margin: number
    revenueDelta: number
    costDelta: number
    hasSales: boolean
    hasCost: boolean
  },
  lang: DashboardLang = 'th',
): DashboardSummary['insight'] {
  if (lang === 'en') {
    if (!metrics.hasSales || !metrics.hasCost) {
      const missing = !metrics.hasSales ? 'sales data' : 'cost data'
      return {
        title: 'Not enough data to analyze profit yet',
        body: `Missing ${missing}. Import the missing file so ROOKAR can calculate profit and margin accurately.`,
        action: 'Import data',
        prompt: 'What data should I import to analyze profit?',
      }
    }
    const top = costBreakdown.reduce((best, slice) => (slice.share > best.share ? slice : best), costBreakdown[0])
    const costWord = metrics.costDelta > 0 ? 'increased' : metrics.costDelta < 0 ? 'decreased' : 'was flat'
    const revenueWord = metrics.revenueDelta >= 0 ? 'grew' : 'declined'
    return {
      title: top && top.share >= 45
        ? `${top.label} accounts for ${top.share}% of total cost`
        : 'Latest revenue and cost overview',
      body: `Revenue ${revenueWord} ${formatPercent(Math.abs(metrics.revenueDelta))} vs the previous period. Net profit was ${formatCurrency(metrics.profit)} (${formatPercent(metrics.margin)}), and total cost ${costWord} ${formatPercent(Math.abs(metrics.costDelta))}.`,
      action: 'Ask AI',
      prompt: top
        ? `Analyze ${top.label} and suggest ways to improve profit from the latest data`
        : 'Analyze revenue, cost, and ways to improve profit from the latest data',
    }
  }
  if (!metrics.hasSales || !metrics.hasCost) {
    const missing = !metrics.hasSales ? 'ไฟล์ยอดขาย' : 'ไฟล์ต้นทุน'
    return {
      title: `ข้อมูลยังไม่ครบสำหรับการวิเคราะห์กำไร`,
      body: `ตอนนี้ยังขาด${missing} ทำให้ ROOKAR คำนวณกำไรและอัตรากำไรได้ไม่สมบูรณ์ นำเข้าไฟล์ที่ขาดเพื่อให้ภาพรวมครบถ้วน`,
      action: 'นำเข้าข้อมูล',
      prompt: 'ควรนำเข้าข้อมูลอะไรเพิ่มเพื่อให้วิเคราะห์กำไรได้ครบถ้วน',
    }
  }
  const top = costBreakdown.reduce((best, slice) => (slice.share > best.share ? slice : best), costBreakdown[0])
  const costWord = metrics.costDelta > 0 ? 'เพิ่มขึ้น' : metrics.costDelta < 0 ? 'ลดลง' : 'ทรงตัว'
  const revenueWord = metrics.revenueDelta >= 0 ? 'เติบโต' : 'ลดลง'
  const title = top && top.share >= 45
    ? `${top.label}คิดเป็น ${top.share}% ของต้นทุนรวม`
    : 'ภาพรวมรายได้และต้นทุนล่าสุด'
  const body = `รายได้${revenueWord} ${formatPercent(Math.abs(metrics.revenueDelta))} เมื่อเทียบช่วงก่อน กำไรสุทธิอยู่ที่ ${formatCurrency(metrics.profit)} (${formatPercent(metrics.margin)}) และต้นทุนรวม${costWord} ${formatPercent(Math.abs(metrics.costDelta))}`
  return {
    title,
    body,
    action: 'ถาม AI ต่อ',
    prompt: top
      ? `วิเคราะห์ต้นทุน${top.label}และแนวทางเพิ่มกำไรจากข้อมูลล่าสุด`
      : 'วิเคราะห์รายได้ ต้นทุน และแนวทางเพิ่มกำไรจากข้อมูลล่าสุด',
  }
}

export async function getDashboard(userId: string, range: Range, industry?: string | null, lang: DashboardLang = 'th'): Promise<DashboardSummary | null> {
  const business = await db.query<{ type: string }>('SELECT type FROM businesses WHERE user_id = ?').get(userId)
  await backfillSourceIndustries(userId, business?.type)

  const allScope = industry === 'all'
  const requested = allScope ? 'all' : await industryForUser(userId, industry)
  const profile = allScope ? null : getIndustryProfile(requested)
  const allSources = await listSources(userId)
  const sources = allScope
    ? allSources.filter((source) => !source.isDemo)
    : allSources.filter(
        (source) => !source.isDemo && source.industryId && normalizeIndustryId(source.industryId) === requested,
      )
  if (sources.length === 0) return null

  const importedSales = sources.some((source) => source.type === 'sales')
  const importedCost = sources.some((source) => source.type !== 'sales')
  const hasCompleteData = importedSales && importedCost

  const facts = await monthFacts(userId, sources.map((source) => source.id))
  if (facts.length === 0) return null

  const count = range === '3m' ? 3 : range === '6m' ? 6 : 12
  const dates = monthSequence(count)
  const currentMonths = new Set(dates.map(monthKey))
  const industryMeta = allScope
    ? buildAllIndustryMeta(sources, allSources, facts, currentMonths)
    : buildIndustryMeta(userId, requested, sources, allSources, facts, currentMonths)
  const segments = buildSegments(facts, currentMonths)
  const costSegments = buildCostSegments(facts, currentMonths)

  const previousDates = Array.from({ length: count }, (_, index) => subMonths(dates[0], count - index))
  const previousMonths = new Set(previousDates.map(monthKey))

  const sum = (types: DataType[], months: Set<string>) =>
    facts.filter((fact) => types.includes(fact.type) && months.has(fact.month)).reduce((total, fact) => total + fact.amount, 0)

  const revenue = sum(['sales'], currentMonths)
  const cost = sum(['materials', 'labor', 'expenses'], currentMonths)
  const profit = hasCompleteData ? revenue - cost : 0
  const margin = hasCompleteData && revenue !== 0 ? (profit / revenue) * 100 : 0
  const previousRevenue = sum(['sales'], previousMonths)
  const previousCost = sum(['materials', 'labor', 'expenses'], previousMonths)
  const previousProfit = hasCompleteData ? previousRevenue - previousCost : 0
  const previousMargin = hasCompleteData && previousRevenue !== 0 ? (previousProfit / previousRevenue) * 100 : 0

  const series = dates.map((date) => {
    const key = monthKey(date)
    const monthRevenue = sum(['sales'], new Set([key]))
    const monthCost = sum(['materials', 'labor', 'expenses'], new Set([key]))
    return {
      label: monthLabel(date, lang),
      revenue: monthRevenue,
      profit: hasCompleteData ? monthRevenue - monthCost : 0,
    }
  })

  const materials = sum(['materials'], currentMonths)
  const labor = sum(['labor'], currentMonths)
  const expenses = sum(['expenses'], currentMonths)
  const splitTotal = materials + labor + expenses
  const share = (value: number) => splitTotal === 0 ? 0 : Math.round((value / splitTotal) * 100)
  const costLabels = lang === 'en'
    ? (profile?.sample.costLabelsEn ?? {
        materials: 'Materials / COGS',
        labor: 'Labor',
        expenses: 'Operating expenses',
      })
    : (profile?.sample.costLabels ?? {
        materials: 'วัตถุดิบ/ต้นทุนขาย',
        labor: 'ค่าแรง',
        expenses: 'ค่าใช้จ่ายดำเนินงาน',
      })
  const costBreakdown: CostSlice[] = [
    { key: 'materials', label: costLabels.materials, value: Math.round(materials), share: share(materials), color: '#000000' },
    { key: 'labor', label: costLabels.labor, value: Math.round(labor), share: share(labor), color: '#D97706' },
    { key: 'expenses', label: costLabels.expenses, value: Math.round(expenses), share: share(expenses), color: '#4F6F6B' },
  ]

  return {
    rangeLabel: range === '3m' ? '3 เดือนล่าสุด' : range === '6m' ? '6 เดือนล่าสุด' : '12 เดือนล่าสุด',
    hasSales: importedSales,
    hasCost: importedCost,
    revenue,
    profit,
    cost,
    margin,
    revenueDelta: pctChange(previousRevenue, revenue),
    profitDelta: pctChange(previousProfit, profit),
    costDelta: pctChange(previousCost, cost),
    marginDelta: Number((margin - previousMargin).toFixed(1)),
    series,
    revenueSpark: series.map((point) => point.revenue),
    profitSpark: series.map((point) => point.profit),
    costSpark: series.map((point) => point.revenue - point.profit),
    marginSpark: series.map((point) => point.revenue === 0 ? 0 : (point.profit / point.revenue) * 100),
    costBreakdown,
    industry: industryMeta,
    segments,
    costSegments,
    insight: buildInsight(costBreakdown, {
      revenue,
      profit,
      margin,
      revenueDelta: pctChange(previousRevenue, revenue),
      costDelta: pctChange(previousCost, cost),
      hasSales: importedSales,
      hasCost: importedCost,
    }, lang),
    lastUpdated: new Date().toISOString(),
  }
}
