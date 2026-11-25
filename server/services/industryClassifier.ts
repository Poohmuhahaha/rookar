import { db } from '../db'
import type { DataType } from '../../src/types'
import { normalizeIndustryId, type IndustryId } from '../../src/lib/industries'

type Classification = { id: IndustryId | null; confidence: number }

const LEXICON: Record<IndustryId, string[]> = {
  fnb: [
    'อาหาร', 'เครื่องดื่ม', 'กาแฟ', 'เมนู', 'ครัว', 'บาริสต้า', 'ร้านอาหาร', 'คาเฟ่',
    'เบเกอรี่', 'ของสด', 'วัตถุดิบ', 'เดลิเวอรี่', 'delivery', 'grab', 'lineman', 'robinhood',
    'dine', 'takeaway', 'store', 'หน้าร้าน', 'ออเดอร์',
  ],
  logistics: [
    'ขนส่ง', 'โลจิสติกส์', 'เที่ยว', 'เส้นทาง', 'รถบรรทุก', 'พขร', 'พนักงานขับ', 'คลังสินค้า',
    'พัสดุ', 'น้ำหนักบรรทุก', 'เที่ยววิ่ง', 'ค่าทางด่วน', 'ดีเซล', 'ผู้ขนส่ง', 'trip', 'route',
    'fleet', 'warehouse', 'delivery fee',
  ],
  'energy-fuel': [
    'น้ำมัน', 'เชื้อเพลิง', 'ลิตร', 'ปั๊ม', 'สถานีบริการ', 'สต็อกน้ำมัน', 'เบนซิน', 'แก๊ส',
    'fuel', 'oil', 'gasoline', 'diesel', 'station', 'ลิตร/บาท',
  ],
  ev: [
    'แบตเตอรี่', 'ชาร์จ', 'ชาร์จเจอร์', 'ev', 'รถยนต์ไฟฟ้า', 'มอเตอร์ไซค์ไฟฟ้า', 'อะไหล่',
    'ช่างเทคนิค', 'kwh', 'charging', 'battery', 'electric vehicle', 'supercharge',
  ],
  healthcare: [
    'ผู้ป่วย', 'คนไข้', 'opd', 'ipd', 'ยา', 'เวชภัณฑ์', 'หัตถการ', 'ห้องตรวจ', 'คลินิก',
    'โรงพยาบาล', 'ประกันสุขภาพ', 'b2g', 'จัดซื้อภาครัฐ', 'patient', 'medical', 'health',
    'ค่ารักษา',
  ],
  'quantum-security': [
    'soc', 'penetration', 'pentest', 'firewall', 'security', 'incident', 'ซอฟต์แวร์',
    'license', 'subscription', 'คลาวด์', 'cyber', 'ควอนตัม', 'เข้ารหัส', 'iso27001',
  ],
}

const TYPE_BOOSTS: Partial<Record<DataType, Partial<Record<IndustryId, number>>>> = {
  labor: { healthcare: 1, 'quantum-security': 1, fnb: 0.5 },
  materials: { 'energy-fuel': 1, ev: 1, logistics: 0.75, fnb: 0.5 },
  expenses: { logistics: 1, 'energy-fuel': 0.75, ev: 0.5 },
  sales: { fnb: 0.5 },
}

export function classifyIndustry(
  text: string,
  type: DataType,
  businessIndustry?: string | null,
): Classification {
  const haystack = text.toLowerCase()
  const scores = new Map<IndustryId, number>()

  for (const [id, keywords] of Object.entries(LEXICON) as [IndustryId, string[]][]) {
    let score = 0
    for (const keyword of keywords) {
      if (haystack.includes(keyword.toLowerCase())) {
        score += keyword.length >= 5 ? 2 : 1
      }
    }
    if (score > 0) scores.set(id, score)
  }

  for (const [id, boost] of Object.entries(TYPE_BOOSTS[type] ?? {}) as [IndustryId, number][]) {
    if (scores.has(id)) scores.set(id, (scores.get(id) ?? 0) + boost)
  }

  const fallback = businessIndustry ? normalizeIndustryId(businessIndustry) : null
  if (fallback) scores.set(fallback, (scores.get(fallback) ?? 0) + 1.5)

  if (scores.size === 0) {
    return { id: fallback, confidence: fallback ? 0.35 : 0 }
  }

  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1])
  const [id, topScore] = ranked[0]
  const secondScore = ranked[1]?.[1] ?? 0
  const total = ranked.reduce((sum, [, score]) => sum + score, 0)
  const confidence = Math.min(0.95, Math.max(0.35, topScore / total))

  return { id, confidence: Number(confidence.toFixed(2)) }
}

export function classifySourceText(
  name: string,
  fileName: string,
  type: DataType,
  payloads: string[],
  businessIndustry?: string | null,
): Classification {
  const text = [name, fileName, ...payloads.slice(0, 80)].join(' ')
  return classifyIndustry(text, type, businessIndustry)
}

type PendingSource = {
  id: string
  name: string
  file_name: string
  type: DataType
}

export async function backfillSourceIndustries(userId: string, businessIndustry?: string | null) {
  const pending = await db
    .query<PendingSource>(
      `SELECT id, name, file_name, type FROM data_sources
       WHERE user_id = ? AND is_demo = 0 AND (industry_id IS NULL OR industry_id = '')`,
    )
    .all(userId)
  if (pending.length === 0) return

  for (const source of pending) {
    const rows = await db
      .query<{ payload_json: string }>('SELECT payload_json FROM data_rows WHERE source_id = ? LIMIT 80')
      .all(source.id)
    const result = classifySourceText(
      source.name,
      source.file_name,
      source.type,
      rows.map((row) => row.payload_json),
      businessIndustry,
    )
    if (!result.id) continue
    await db
      .query('UPDATE data_sources SET industry_id = ?, industry_confidence = ? WHERE id = ?')
      .run(result.id, result.confidence, source.id)
  }
}
