import { startOfMonth, subMonths } from 'date-fns'
import { getIndustryProfile } from '../../src/lib/industries'
import type { DataSource, DataType } from '../../src/types'
import type { IndustryId } from '../../src/lib/industries'
import { db } from '../db'
import { newId, nowIso } from '../auth'

type SourceRow = { occurredOn: string | null; amount: number | null; label: string | null; payload: Record<string, string | number> }

const thaiMonth = new Intl.DateTimeFormat('th-TH', { month: 'short' })

function monthLabel(date: Date) {
  return thaiMonth.format(date)
}

function dateLabel(offset: number) {
  const date = new Date()
  date.setDate(date.getDate() - offset)
  return date.toISOString().slice(0, 10)
}

export function demoSourcesForIndustry(industryId: IndustryId): DataSource[] {
  const profile = getIndustryProfile(industryId)
  const now = new Date()
  return profile.sample.sources.map((source, index) => ({
    id: newId('ds'),
    name: source.name,
    type: source.type,
    typeLabel: source.typeLabel,
    rowCount: source.rowCount,
    quality: source.quality,
    updatedAt: new Date(Date.now() - (index + 1) * 86_400_000).toISOString(),
    period: `ม.ค. – ${monthLabel(now)} ${now.getFullYear() + 543}`,
    fileName: source.fileName,
    isDemo: true,
    industryId,
  }))
}

export function buildDemoRows(industryId: IndustryId, type: DataType): {
  columns: { key: string; label: string }[]
  rows: Record<string, string | number>[]
} {
  const profile = getIndustryProfile(industryId)
  const revenueSeries = profile.sample.revenue.slice(-8)
  const profitSeries = profile.sample.profit.slice(-8)
  const lastRevenue = profile.sample.revenue.at(-1) ?? 0
  const lastProfit = profile.sample.profit.at(-1) ?? 0
  const lastCost = lastRevenue - lastProfit
  const now = startOfMonth(new Date())

  if (type === 'sales') {
    return {
      columns: [
        { key: 'month', label: 'เดือน' },
        { key: 'revenue', label: 'รายได้ (บาท)' },
        { key: 'profit', label: 'กำไร (บาท)' },
      ],
      rows: revenueSeries
        .map((revenue, index) => {
          const date = subMonths(now, revenueSeries.length - 1 - index)
          return {
            month: `${monthLabel(date)} ${date.getFullYear() + 543}`,
            revenue: revenue.toLocaleString('th-TH'),
            profit: (profitSeries[index] ?? 0).toLocaleString('th-TH'),
          }
        })
        .reverse(),
    }
  }

  if (type === 'materials') {
    const amount = Math.round((lastCost * profile.sample.costSplit.materials) / 100 / 3)
    return {
      columns: [
        { key: 'date', label: 'วันที่' },
        { key: 'item', label: 'รายการ' },
        { key: 'quantity', label: 'จำนวน' },
        { key: 'unitPrice', label: 'ราคาต่อหน่วย (บาท)' },
        { key: 'total', label: 'ยอดรวม (บาท)' },
      ],
      rows: Array.from({ length: 5 }, (_, index) => ({
        date: dateLabel(index + 1),
        item: `${profile.sample.costLabels.materials} (รายการที่ ${index + 1})`,
        quantity: `${100 + index * 20} หน่วย`,
        unitPrice: Math.round(amount / (100 + index * 20)).toLocaleString('th-TH'),
        total: amount.toLocaleString('th-TH'),
      })),
    }
  }

  if (type === 'labor') {
    const amount = Math.round((lastCost * profile.sample.costSplit.labor) / 100 / 5)
    const names = ['สมชาย ใจดี', 'พิมพ์มาดา วงศ์สุวรรณ', 'ธนภัทร พรหมมา', 'สุริยา มิ่งเมือง', 'กิตติศักดิ์ ศรีสุข']
    return {
      columns: [
        { key: 'date', label: 'วันที่' },
        { key: 'name', label: 'ชื่อพนักงาน' },
        { key: 'role', label: 'ตำแหน่ง' },
        { key: 'hours', label: 'ชั่วโมงทำงาน' },
        { key: 'amount', label: 'ค่าจ้างรวม (บาท)' },
      ],
      rows: names.map((name, index) => ({
        date: dateLabel(index + 1),
        name,
        role: profile.sample.costLabels.labor,
        hours: `${160 - index * 8} ชม.`,
        amount: amount.toLocaleString('th-TH'),
      })),
    }
  }

  const amount = Math.round((lastCost * profile.sample.costSplit.expenses) / 100 / 4)
  return {
    columns: [
      { key: 'date', label: 'วันที่' },
      { key: 'category', label: 'หมวดหมู่' },
      { key: 'description', label: 'รายละเอียด' },
      { key: 'amount', label: 'จำนวนเงิน (บาท)' },
    ],
    rows: Array.from({ length: 4 }, (_, index) => ({
      date: dateLabel(index + 1),
      category: profile.sample.costLabels.expenses,
      description: `${profile.sample.costLabels.expenses} รายการที่ ${index + 1}`,
      amount: amount.toLocaleString('th-TH'),
    })),
  }
}

export function replaceDemoSources(userId: string, industryId: IndustryId): DataSource[] {
  db.query("DELETE FROM data_sources WHERE user_id = ? AND is_demo = 1").run(userId)
  const sources = demoSourcesForIndustry(industryId)
  const insert = db.query(
    `INSERT INTO data_sources
     (id, user_id, name, type, type_label, row_count, quality, period, file_name, is_demo, industry_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
  )
  const now = nowIso()
  for (const source of sources) {
    insert.run(
      source.id,
      userId,
      source.name,
      source.type,
      source.typeLabel,
      source.rowCount,
      source.quality,
      source.period,
      source.fileName,
      industryId,
      now,
      source.updatedAt,
    )
  }
  return sources
}

export function insertImportedRows(sourceId: string, rows: SourceRow[]) {
  const insert = db.query(
    `INSERT INTO data_rows (source_id, row_index, occurred_on, amount, label, payload_json)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
  rows.forEach((row, index) => {
    insert.run(sourceId, index, row.occurredOn, row.amount, row.label, JSON.stringify(row.payload))
  })
}
