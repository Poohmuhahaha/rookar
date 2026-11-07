import { db } from '../db'
import type { DataQuality, DataSource, DataType } from '../../src/types'
import { getIndustryProfile, normalizeIndustryId, type IndustryId } from '../../src/lib/industries'
import { buildDemoRows, replaceDemoSources } from './demo'

type SourceRecord = {
  id: string
  name: string
  type: DataType
  type_label: string
  row_count: number
  quality: DataQuality
  period: string
  file_name: string
  is_demo: number
  industry_id: string | null
  updated_at: string
}

function mapSource(row: SourceRecord): DataSource {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    typeLabel: row.type_label,
    rowCount: row.row_count,
    quality: row.quality,
    period: row.period,
    fileName: row.file_name,
    isDemo: Boolean(row.is_demo),
    industryId: row.industry_id ?? undefined,
    updatedAt: row.updated_at,
  }
}

export function listSources(userId: string): DataSource[] {
  const rows = db
    .query('SELECT * FROM data_sources WHERE user_id = ? ORDER BY updated_at DESC')
    .all(userId) as SourceRecord[]
  return rows.map(mapSource)
}

export function getSource(userId: string, id: string): DataSource | null {
  const row = db
    .query('SELECT * FROM data_sources WHERE id = ? AND user_id = ?')
    .get(id, userId) as SourceRecord | null
  return row ? mapSource(row) : null
}

export function deleteSource(userId: string, id: string) {
  db.query('DELETE FROM data_sources WHERE id = ? AND user_id = ?').run(id, userId)
}

export function seedSources(userId: string, industry?: string | null): DataSource[] {
  const industryId = normalizeIndustryId(industry)
  return replaceDemoSources(userId, industryId)
}

export function getSourceRows(userId: string, id: string) {
  const source = getSource(userId, id)
  if (!source) return { columns: [], rows: [] }

  if (source.isDemo) {
    const industry = normalizeIndustryId(source.industryId)
    return buildDemoRows(industry, source.type)
  }

  const rows = db
    .query('SELECT payload_json FROM data_rows WHERE source_id = ? ORDER BY row_index ASC')
    .all(id) as { payload_json: string }[]
  const parsed = rows.map((row) => JSON.parse(row.payload_json) as Record<string, string | number>)
  const first = parsed[0] ?? {}
  return {
    columns: Object.keys(first).map((key) => ({ key, label: key })),
    rows: parsed,
  }
}

export function industryForUser(userId: string, requested?: string | null): IndustryId {
  if (requested) return normalizeIndustryId(requested)
  const source = db
    .query("SELECT industry_id FROM data_sources WHERE user_id = ? AND is_demo = 1 AND industry_id IS NOT NULL LIMIT 1")
    .get(userId) as { industry_id: string } | null
  if (source?.industry_id) return normalizeIndustryId(source.industry_id)
  const business = db.query('SELECT type FROM businesses WHERE user_id = ?').get(userId) as { type: string } | null
  return normalizeIndustryId(business?.type)
}

export function profileForUser(userId: string, requested?: string | null) {
  return getIndustryProfile(industryForUser(userId, requested))
}
