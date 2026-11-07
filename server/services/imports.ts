import { db } from '../db'
import { newId, nowIso } from '../auth'
import type { DataQuality, DataType, ImportErrorRow, ImportPreview } from '../../src/types'
import { insertImportedRows } from './demo'

type FieldDef = { key: string; label: string; required: boolean; keywords: string[] }

const fieldDefs: Record<DataType, FieldDef[]> = {
  sales: [
    { key: 'date', label: 'วันที่', required: true, keywords: ['วันที่', 'date', 'วัน', 'transaction', 'period'] },
    { key: 'amount', label: 'ยอดขาย', required: true, keywords: ['ยอดขาย', 'amount', 'total', 'รายได้', 'sales', 'revenue', 'gross'] },
    { key: 'orders', label: 'จำนวนออเดอร์', required: false, keywords: ['ออเดอร์', 'order', 'จำนวน', 'bill', 'transaction'] },
    { key: 'channel', label: 'ช่องทางขาย', required: false, keywords: ['ช่องทาง', 'channel', 'platform', 'source'] },
  ],
  materials: [
    { key: 'date', label: 'วันที่', required: true, keywords: ['วันที่', 'date', 'วัน'] },
    { key: 'item', label: 'ชื่อวัตถุดิบ', required: true, keywords: ['วัตถุดิบ', 'item', 'name', 'สินค้า', 'material', 'product', 'sku'] },
    { key: 'quantity', label: 'จำนวน', required: false, keywords: ['จำนวน', 'quantity', 'qty', 'volume'] },
    { key: 'unitPrice', label: 'ราคาต่อหน่วย', required: false, keywords: ['ราคาต่อหน่วย', 'unit', 'price', 'unitprice'] },
    { key: 'total', label: 'ยอดรวม', required: true, keywords: ['รวม', 'total', 'amount', 'cost', 'ต้นทุน'] },
  ],
  labor: [
    { key: 'date', label: 'วันที่', required: true, keywords: ['วันที่', 'date', 'วัน'] },
    { key: 'name', label: 'ชื่อพนักงาน', required: true, keywords: ['ชื่อพนักงาน', 'พนักงาน', 'name', 'employee', 'staff'] },
    { key: 'role', label: 'ตำแหน่ง', required: false, keywords: ['ตำแหน่ง', 'role', 'position'] },
    { key: 'hours', label: 'ชั่วโมงทำงาน', required: false, keywords: ['ชั่วโมง', 'hour', 'hours'] },
    { key: 'amount', label: 'ค่าแรง', required: true, keywords: ['ค่าแรง', 'เงินเดือน', 'amount', 'salary', 'wage'] },
  ],
  expenses: [
    { key: 'date', label: 'วันที่', required: true, keywords: ['วันที่', 'date', 'วัน'] },
    { key: 'category', label: 'หมวดหมู่', required: true, keywords: ['หมวดหมู่', 'category', 'ประเภท', 'type'] },
    { key: 'description', label: 'รายละเอียด', required: false, keywords: ['รายละเอียด', 'description', 'detail', 'note'] },
    { key: 'amount', label: 'จำนวนเงิน', required: true, keywords: ['จำนวนเงิน', 'amount', 'total', 'รวม', 'expense', 'cost'] },
  ],
}

const aiKeywords: Record<DataType, string[]> = {
  sales: ['sale', 'sales', 'revenue', 'pos', 'order', 'channel', 'ยอดขาย', 'รายได้', 'ออเดอร์', 'ช่องทาง'],
  materials: ['material', 'ingredient', 'stock', 'inventory', 'sku', 'วัตถุดิบ', 'สินค้า', 'สต็อก'],
  labor: ['payroll', 'salary', 'wage', 'employee', 'staff', 'labor', 'พนักงาน', 'เงินเดือน', 'ค่าแรง', 'ชั่วโมง'],
  expenses: ['expense', 'opex', 'rent', 'marketing', 'ค่าใช้จ่าย', 'ค่าเช่า', 'การตลาด', 'หมวดหมู่'],
}

const typeLabels: Record<DataType, string> = {
  sales: 'ยอดขาย',
  materials: 'ต้นทุนวัตถุดิบ',
  labor: 'ค่าแรง',
  expenses: 'ค่าใช้จ่ายอื่น',
}

const delimiters = [',', ';', '\t'] as const

function detectDelimiter(line: string): string {
  let best: string = ','
  let bestCount = 0
  for (const delimiter of delimiters) {
    let count = 0
    let inQuotes = false
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') i += 1
        else inQuotes = !inQuotes
      } else if (char === delimiter && !inQuotes) count += 1
    }
    if (count > bestCount) {
      best = delimiter
      bestCount = count
    }
  }
  return best
}

function parseLine(line: string, delimiter: string): string[] {
  const values: string[] = []
  let value = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        value += '"'
        i += 1
      } else inQuotes = !inQuotes
    } else if (char === delimiter && !inQuotes) {
      values.push(value.trim())
      value = ''
    } else value += char
  }
  values.push(value.trim())
  return values
}

function headerless(cells: string[]): boolean {
  const first = cells[0]?.trim() ?? ''
  if (/^\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}$/.test(first)) return true
  const nums = cells.filter((cell) => {
    const normalized = cell.replace(/[,\s฿$]/g, '')
    return normalized !== '' && !Number.isNaN(Number(normalized))
  })
  return nums.length >= 2 && nums.length >= cells.length - 1
}

export function parseCsv(text: string): { columns: string[]; rows: Record<string, string>[] } {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  if (lines.length < 1) throw new Error('ไฟล์ CSV ว่างเปล่า')
  const delimiter = detectDelimiter(lines[0])
  const firstCells = parseLine(lines[0], delimiter)
  const hasHeader = !headerless(firstCells)
  const columns = hasHeader ? firstCells.map((cell, index) => cell || `คอลัมน์ ${index + 1}`) : firstCells.map((_, index) => `คอลัมน์ ${index + 1}`)
  const dataLines = hasHeader ? lines.slice(1) : lines
  return {
    columns,
    rows: dataLines.map((line) => {
      const cells = parseLine(line, delimiter)
      return Object.fromEntries(columns.map((column, index) => [column, cells[index] ?? '']))
    }),
  }
}

export function classifyCsv(fileName: string, columns: string[], rows: Record<string, string>[]) {
  const header = columns.join(' ').toLowerCase()
  const sample = rows.slice(0, 5).map((row) => Object.values(row).join(' ')).join(' ').toLowerCase()
  const name = fileName.toLowerCase()
  let bestType: DataType = 'sales'
  let bestScore = 0
  let bestMatched: string[] = []
  for (const type of Object.keys(fieldDefs) as DataType[]) {
    let score = 0
    const matched: string[] = []
    for (const field of fieldDefs[type]) {
      if (field.keywords.some((keyword) => header.includes(keyword.toLowerCase()))) {
        score += field.required ? 3 : 1
        matched.push(field.label)
      }
    }
    for (const keyword of aiKeywords[type]) {
      if (header.includes(keyword) || name.includes(keyword) || sample.includes(keyword)) score += 2
    }
    if (score > bestScore) {
      bestScore = score
      bestType = type
      bestMatched = matched
    }
  }
  return {
    type: bestType,
    confidence: bestScore === 0 ? 0 : Math.min(94, 50 + bestScore * 4),
    reason: bestMatched.length ? `พบคอลัมน์: ${bestMatched.join(', ')}` : 'จับคู่จากชื่อไฟล์และหัวตาราง',
  }
}

function parseDate(value: string): string | null {
  const text = value.trim()
  let match = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
  if (match) return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
  match = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/)
  if (match) {
    const year = Number(match[3]) > 2400 ? Number(match[3]) - 543 : Number(match[3])
    return `${year}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`
  }
  const parsed = new Date(text)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10)
}

function parseAmount(value: string): number | null {
  const normalized = value.replace(/[,\s฿$]/g, '').replace(/\((.*)\)/, '-$1')
  if (!normalized) return null
  const amount = Number(normalized)
  return Number.isFinite(amount) ? amount : null
}

type Validated = {
  errors: ImportErrorRow[]
  duplicateRows: number
  validRows: number
  normalized: { occurredOn: string | null; amount: number | null; label: string | null; payload: Record<string, string | number> }[]
}

function validateRows(
  type: DataType,
  rows: Record<string, string>[],
  mapping: Record<string, string>,
): Validated {
  const defs = fieldDefs[type]
  const missing = defs.filter((field) => field.required && !mapping[field.key])
  if (missing.length) throw new Error(`ยังไม่ได้จับคู่คอลัมน์: ${missing.map((field) => field.label).join(', ')}`)

  const errors: ImportErrorRow[] = []
  const seen = new Set<string>()
  let duplicateRows = 0
  const normalized: Validated['normalized'] = []

  rows.forEach((row, index) => {
    const payload: Record<string, string | number> = {}
    for (const field of defs) {
      const column = mapping[field.key]
      payload[field.label] = column ? row[column] ?? '' : ''
    }
    const dateValue = mapping.date ? row[mapping.date] ?? '' : ''
    const occurredOn = parseDate(dateValue)
    if (!occurredOn) errors.push({ row: index + 2, field: 'วันที่', message: 'รูปแบบวันที่ไม่ถูกต้อง (คาดว่า YYYY-MM-DD)' })

    const amountKey = type === 'materials' ? 'total' : 'amount'
    const amountValue = mapping[amountKey] ? row[mapping[amountKey]] ?? '' : ''
    const amount = parseAmount(amountValue)
    if (amount === null || amount <= 0) {
      errors.push({ row: index + 2, field: defs.find((field) => field.key === amountKey)?.label ?? 'จำนวน', message: 'ต้องเป็นตัวเลขและมากกว่าศูนย์' })
    }

    if (!occurredOn || amount === null || amount <= 0) return

    const labelKey = type === 'materials' ? 'item' : type === 'labor' ? 'name' : type === 'expenses' ? 'category' : 'channel'
    const label = mapping[labelKey] ? String(row[mapping[labelKey]] ?? '') : ''
    const duplicateKey = `${occurredOn}|${amount}|${label}`
    if (seen.has(duplicateKey)) {
      duplicateRows += 1
      return
    }
    seen.add(duplicateKey)
    normalized.push({ occurredOn, amount, label: label || null, payload })
  })

  return {
    errors: errors.slice(0, 20),
    duplicateRows,
    validRows: normalized.length,
    normalized,
  }
}

type PreviewRecord = {
  id: string
  type: DataType
  file_name: string
  file_size: number
  columns_json: string
  rows_json: string
  total_rows: number
  valid_rows: number
  duplicate_rows: number
  error_rows: number
}

export async function createPreview(userId: string, file: File, requestedType: DataType): Promise<ImportPreview & { previewId: string; classification: ReturnType<typeof classifyCsv> }> {
  if (!file.name.toLowerCase().endsWith('.csv')) throw new Error('รองรับเฉพาะไฟล์ CSV')
  if (file.size > 10 * 1024 * 1024) throw new Error('ขนาดไฟล์ต้องไม่เกิน 10 MB')
  const text = await file.text()
  const parsed = parseCsv(text)
  if (parsed.rows.length === 0) throw new Error('ไฟล์ CSV ต้องมีหัวตารางและข้อมูลอย่างน้อย 1 แถว')
  const classification = classifyCsv(file.name, parsed.columns, parsed.rows)
  const previewId = newId('preview')
  db.query(
    `INSERT INTO import_previews
     (id, user_id, type, file_name, file_size, columns_json, rows_json, errors_json, total_rows, valid_rows, duplicate_rows, error_rows, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, '[]', ?, ?, 0, 0, ?, ?)`,
  ).run(
    previewId,
    userId,
    requestedType,
    file.name,
    file.size,
    JSON.stringify(parsed.columns),
    JSON.stringify(parsed.rows),
    parsed.rows.length,
    parsed.rows.length,
    nowIso(),
    new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  )
  return {
    previewId,
    classification,
    fileName: file.name,
    fileSize: file.size,
    totalRows: parsed.rows.length,
    validRows: parsed.rows.length,
    duplicateRows: 0,
    errorRows: 0,
    columns: parsed.columns,
    rows: parsed.rows.slice(0, 5),
    errors: [],
    type: requestedType,
  }
}

function getPreview(userId: string, previewId: string): PreviewRecord | null {
  const record = db
    .query('SELECT * FROM import_previews WHERE id = ? AND user_id = ? AND expires_at > ?')
    .get(previewId, userId, nowIso()) as PreviewRecord | null
  return record ?? null
}

export function validatePreview(userId: string, previewId: string, mapping: Record<string, string>): ImportPreview {
  const record = getPreview(userId, previewId)
  if (!record) throw new Error('ไม่พบ preview หรือหมดอายุแล้ว')
  const rows = JSON.parse(record.rows_json) as Record<string, string>[]
  const validated = validateRows(record.type, rows, mapping)
  db.query(
    'UPDATE import_previews SET errors_json = ?, valid_rows = ?, duplicate_rows = ?, error_rows = ? WHERE id = ?',
  ).run(JSON.stringify(validated.errors), validated.validRows, validated.duplicateRows, validated.errors.length, previewId)
  return {
    previewId: record.id,
    fileName: record.file_name,
    fileSize: record.file_size,
    totalRows: record.total_rows,
    validRows: validated.validRows,
    duplicateRows: validated.duplicateRows,
    errorRows: validated.errors.length,
    columns: JSON.parse(record.columns_json) as string[],
    rows: rows.slice(0, 5),
    errors: validated.errors,
    type: record.type,
  }
}

export function commitPreview(userId: string, previewId: string, mapping: Record<string, string>) {
  const record = getPreview(userId, previewId)
  if (!record) throw new Error('ไม่พบ preview หรือหมดอายุแล้ว')
  const rows = JSON.parse(record.rows_json) as Record<string, string>[]
  const validated = validateRows(record.type, rows, mapping)
  if (validated.normalized.length === 0) throw new Error('ไม่มีแถวที่พร้อมนำเข้า')

  const quality: DataQuality = validated.errors.length > 0 ? 'partial' : validated.duplicateRows > 0 ? 'duplicate' : 'complete'
  const sourceId = newId('ds')
  const fileBase = record.file_name.replace(/\.[^.]+$/, '').trim()
  const now = new Date()
  const month = new Intl.DateTimeFormat('th-TH', { month: 'short', year: 'numeric' }).format(now)
  const period = `ม.ค. – ${month}`
  const name = fileBase ? `${typeLabels[record.type]} · ${fileBase}` : typeLabels[record.type]
  db.transaction(() => {
    db.query(
      `INSERT INTO data_sources
       (id, user_id, name, type, type_label, row_count, quality, period, file_name, is_demo, industry_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, ?, ?)`,
    ).run(sourceId, userId, name, record.type, typeLabels[record.type], validated.normalized.length, quality, period, record.file_name, now.toISOString(), now.toISOString())
    insertImportedRows(sourceId, validated.normalized)
    db.query('DELETE FROM import_previews WHERE id = ?').run(previewId)
  })()
  return {
    id: sourceId,
    name,
    type: record.type,
    typeLabel: typeLabels[record.type],
    rowCount: validated.normalized.length,
    quality,
    period,
    fileName: record.file_name,
    updatedAt: now.toISOString(),
  }
}
