import { db } from '../db'
import type { DataQuality, DataSource, DataType } from '../../src/types'
import { getIndustryProfile, INDUSTRY_PROFILES, normalizeIndustryId, type IndustryId } from '../../src/lib/industries'

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
  industry_confidence: number | null
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
    industryConfidence: row.industry_confidence ?? undefined,
    updatedAt: row.updated_at,
  }
}

export async function listSources(userId: string): Promise<DataSource[]> {
  const rows = await db
    .query<SourceRecord>('SELECT * FROM data_sources WHERE user_id = ? ORDER BY updated_at DESC')
    .all(userId)
  return rows.map(mapSource)
}

export async function getSource(userId: string, id: string): Promise<DataSource | null> {
  const row = await db
    .query<SourceRecord>('SELECT * FROM data_sources WHERE id = ? AND user_id = ?')
    .get(id, userId)
  return row ? mapSource(row) : null
}

export async function deleteSource(userId: string, id: string) {
  await db.query('DELETE FROM data_sources WHERE id = ? AND user_id = ?').run(id, userId)
}

export async function setSourceIndustry(userId: string, id: string, industryId: string | null): Promise<DataSource | null> {
  if (industryId !== null && !Object.hasOwn(INDUSTRY_PROFILES, industryId)) return null
  const result = await db
    .query('UPDATE data_sources SET industry_id = ?, industry_confidence = ? WHERE id = ? AND user_id = ?')
    .run(industryId, industryId ? 1 : null, id, userId)
  if (result.changes === 0) return null
  return getSource(userId, id)
}

export async function getSourceRows(userId: string, id: string, limit = 2000) {
  const source = await getSource(userId, id)
  if (!source) return { columns: [], rows: [] }

  const cappedLimit = Math.min(Math.max(Math.trunc(limit), 1), 5000)
  const rows = await db
    .query<{ payload_json: string }>('SELECT payload_json FROM data_rows WHERE source_id = ? ORDER BY row_index ASC LIMIT ?')
    .all(id, cappedLimit)
  const parsed = rows.map((row) => JSON.parse(row.payload_json) as Record<string, string | number>)
  const first = parsed[0] ?? {}
  return {
    columns: Object.keys(first).map((key) => ({ key, label: key })),
    rows: parsed,
  }
}

export async function industryForUser(userId: string, requested?: string | null): Promise<IndustryId> {
  if (requested) return normalizeIndustryId(requested)
  const business = await db.query<{ type: string }>('SELECT type FROM businesses WHERE user_id = ?').get(userId)
  return normalizeIndustryId(business?.type)
}

export async function industryWithData(userId: string, requested?: string | null): Promise<IndustryId> {
  const requestedId = requested ? normalizeIndustryId(requested) : null
  if (requestedId) {
    const hasRequested = await db
      .query('SELECT 1 AS ok FROM data_sources WHERE user_id = ? AND is_demo = 0 AND industry_id = ? LIMIT 1')
      .get(userId, requestedId)
    if (hasRequested) return requestedId
  }
  const latest = await db
    .query<{ industry_id: string }>(
      "SELECT industry_id FROM data_sources WHERE user_id = ? AND is_demo = 0 AND industry_id IS NOT NULL ORDER BY updated_at DESC LIMIT 1",
    )
    .get(userId)
  if (latest?.industry_id) return normalizeIndustryId(latest.industry_id)
  return industryForUser(userId, requested)
}

export async function profileForUser(userId: string, requested?: string | null) {
  return getIndustryProfile(await industryForUser(userId, requested))
}
