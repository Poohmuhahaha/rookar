import { startOfMonth, subMonths } from 'date-fns'
import type { CostSlice, DashboardSummary, DataType } from '../../src/types'
import { profileForUser, listSources } from './sources'
import { db } from '../db'

type Range = '3m' | '6m' | '12m'
type MonthFact = { month: string; type: DataType; amount: number }

const monthFormatter = new Intl.DateTimeFormat('th-TH', { month: 'short' })

function pctChange(from: number, to: number): number {
  if (from === 0) return 0
  return Number((((to - from) / from) * 100).toFixed(1))
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(date: Date) {
  return monthFormatter.format(date)
}

function monthSequence(count: number) {
  const now = startOfMonth(new Date())
  return Array.from({ length: count }, (_, index) => subMonths(now, count - 1 - index))
}

function monthFacts(userId: string): MonthFact[] {
  const rows = db
    .query(
      `SELECT s.type AS type, r.occurred_on AS occurred_on, r.amount AS amount
       FROM data_rows r
       JOIN data_sources s ON s.id = r.source_id
       WHERE s.user_id = ? AND r.occurred_on IS NOT NULL AND r.amount IS NOT NULL`,
    )
    .all(userId) as { type: DataType; occurred_on: string; amount: number }[]
  return rows.map((row) => ({
    month: row.occurred_on.slice(0, 7),
    type: row.type,
    amount: Number(row.amount) || 0,
  }))
}

function fallbackSummary(userId: string, range: Range, industry?: string | null): DashboardSummary {
  const profile = profileForUser(userId, industry)
  const count = range === '3m' ? 3 : range === '6m' ? 6 : 12
  const dates = monthSequence(count)
  const series = dates.map((date, index) => ({
    label: monthLabel(date),
    revenue: profile.sample.revenue[12 - count + index] ?? 0,
    profit: profile.sample.profit[12 - count + index] ?? 0,
  }))
  const revenue = series.reduce((sum, point) => sum + point.revenue, 0)
  const profit = series.reduce((sum, point) => sum + point.profit, 0)
  const cost = revenue - profit
  const margin = revenue === 0 ? 0 : (profit / revenue) * 100

  let previousRevenue = 0
  let previousProfit = 0
  if (range === '12m') {
    const growthFactor = 1 + profile.sample.priorYearGrowth
    const priorMargin = margin - profile.sample.priorYearMarginDelta
    previousRevenue = revenue / growthFactor
    previousProfit = previousRevenue * (priorMargin / 100)
  } else {
    const end = 12 - count
    const start = end - count
    previousRevenue = profile.sample.revenue.slice(start, end).reduce((sum, value) => sum + value, 0)
    previousProfit = profile.sample.profit.slice(start, end).reduce((sum, value) => sum + value, 0)
  }
  const previousCost = previousRevenue - previousProfit
  const previousMargin = previousRevenue === 0 ? 0 : (previousProfit / previousRevenue) * 100
  const shares = profile.sample.costSplit
  const costBreakdown: CostSlice[] = [
    { key: 'materials', label: profile.sample.costLabels.materials, value: Math.round(cost * shares.materials / 100), share: shares.materials, color: '#000000' },
    { key: 'labor', label: profile.sample.costLabels.labor, value: Math.round(cost * shares.labor / 100), share: shares.labor, color: '#D97706' },
    { key: 'expenses', label: profile.sample.costLabels.expenses, value: Math.round(cost * shares.expenses / 100), share: shares.expenses, color: '#4F6F6B' },
  ]

  return {
    rangeLabel: range === '3m' ? '3 เดือนล่าสุด' : range === '6m' ? '6 เดือนล่าสุด' : '12 เดือนล่าสุด',
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
    insight: profile.sample.insight,
    lastUpdated: new Date().toISOString(),
  }
}

export function getDashboard(userId: string, range: Range, industry?: string | null): DashboardSummary | null {
  const sources = listSources(userId)
  if (sources.length === 0) return null
  const profile = profileForUser(userId, industry)
  const importedSales = sources.some((source) => !source.isDemo && source.type === 'sales')
  const importedCost = sources.some((source) => !source.isDemo && source.type !== 'sales')
  const facts = importedSales && importedCost ? monthFacts(userId) : []
  if (!importedSales || !importedCost || facts.length === 0) return fallbackSummary(userId, range, industry)

  const count = range === '3m' ? 3 : range === '6m' ? 6 : 12
  const dates = monthSequence(count)
  const currentMonths = new Set(dates.map(monthKey))
  const previousDates = Array.from({ length: count }, (_, index) => subMonths(dates[0], count - index))
  const previousMonths = new Set(previousDates.map(monthKey))

  const sum = (types: DataType[], months: Set<string>) =>
    facts.filter((fact) => types.includes(fact.type) && months.has(fact.month)).reduce((total, fact) => total + fact.amount, 0)

  const revenue = sum(['sales'], currentMonths)
  const cost = sum(['materials', 'labor', 'expenses'], currentMonths)
  const profit = revenue - cost
  const margin = revenue === 0 ? 0 : (profit / revenue) * 100
  const previousRevenue = sum(['sales'], previousMonths)
  const previousCost = sum(['materials', 'labor', 'expenses'], previousMonths)
  const previousProfit = previousRevenue - previousCost
  const previousMargin = previousRevenue === 0 ? 0 : (previousProfit / previousRevenue) * 100

  const series = dates.map((date) => {
    const key = monthKey(date)
    const monthRevenue = sum(['sales'], new Set([key]))
    const monthCost = sum(['materials', 'labor', 'expenses'], new Set([key]))
    return { label: monthLabel(date), revenue: monthRevenue, profit: monthRevenue - monthCost }
  })

  const materials = sum(['materials'], currentMonths)
  const labor = sum(['labor'], currentMonths)
  const expenses = sum(['expenses'], currentMonths)
  const splitTotal = materials + labor + expenses
  const share = (value: number) => splitTotal === 0 ? 0 : Math.round((value / splitTotal) * 100)
  const costBreakdown: CostSlice[] = [
    { key: 'materials', label: profile.sample.costLabels.materials, value: Math.round(materials), share: share(materials), color: '#000000' },
    { key: 'labor', label: profile.sample.costLabels.labor, value: Math.round(labor), share: share(labor), color: '#D97706' },
    { key: 'expenses', label: profile.sample.costLabels.expenses, value: Math.round(expenses), share: share(expenses), color: '#4F6F6B' },
  ]

  return {
    rangeLabel: range === '3m' ? '3 เดือนล่าสุด' : range === '6m' ? '6 เดือนล่าสุด' : '12 เดือนล่าสุด',
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
    insight: profile.sample.insight,
    lastUpdated: new Date().toISOString(),
  }
}
