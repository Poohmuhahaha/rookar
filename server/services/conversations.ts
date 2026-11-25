import { formatCurrency, formatPercent } from '../../src/lib/format'
import type { Conversation } from '../../src/types'
import { db } from '../db'
import { newId } from '../auth'
import { getDashboard } from './dashboard'
import { listSources, profileForUser } from './sources'

type Row = { data_json: string; updated_at: string }

async function seedConversations(userId: string): Promise<Conversation[]> {
  const profile = await profileForUser(userId)
  const summary = await getDashboard(userId, '6m', profile.id)
  const sources = await listSources(userId)
  const cost = summary?.costBreakdown.slice().sort((a, b) => b.share - a.share)[0]
  const revenue = summary?.revenue ?? 0
  const profit = summary?.profit ?? 0
  const margin = summary?.margin ?? 0
  const now = new Date().toISOString()
  const yesterday = new Date(Date.now() - 86_400_000).toISOString()
  const earlier = new Date(Date.now() - 4 * 86_400_000).toISOString()
  return [
    {
      id: newId('conv'),
      title: `วิเคราะห์ ${profile.shortLabel}`,
      preview: summary?.insight.title ?? 'เริ่มวิเคราะห์ธุรกิจของคุณ',
      updatedAt: now,
      group: 'วันนี้',
      avatars: ['AL', 'RK'],
      specialistRole: 'general',
      messages: [
        {
          id: 'msg_welcome_user',
          role: 'user',
          content: `ช่วยสรุปภาพรวม${profile.label}ให้หน่อย`,
          createdAt: now,
        },
        {
          id: 'msg_welcome_ai',
          role: 'assistant',
          content: `ภาพรวม 6 เดือนล่าสุด:\n\n• รายได้ ${formatCurrency(revenue)}\n• กำไรสุทธิ ${formatCurrency(profit)} (${formatPercent(margin)})\n• ต้นทุนหลัก: ${cost?.label ?? '—'} (${cost?.share ?? 0}%)\n\nจุดที่ควรจับตา: ${profile.focusPoints[0]}`,
          citations: cost ? [{
            id: 'cit_welcome_cost',
            title: cost.label,
            period: '6 เดือนล่าสุด',
            value: formatCurrency(cost.value),
            source: sources.find((source) => source.type === 'materials')?.fileName ?? 'cost.csv',
          }] : [],
          createdAt: now,
        },
      ],
    },
    {
      id: newId('conv'),
      title: 'สรุปกำไร 6 เดือนล่าสุด',
      preview: `กำไรสุทธิ ${formatCurrency(profit)}`,
      updatedAt: yesterday,
      group: 'เมื่อวาน',
      avatars: ['AL'],
      specialistRole: 'finance',
      messages: [
        { id: 'msg_profit_user', role: 'user', content: 'สรุปกำไร 6 เดือนล่าสุดให้หน่อย', createdAt: yesterday },
        {
          id: 'msg_profit_ai',
          role: 'assistant',
          content: `กำไรสุทธิ 6 เดือนล่าสุดอยู่ที่ ${formatCurrency(profit)} จากรายได้ ${formatCurrency(revenue)} คิดเป็นอัตรากำไร ${formatPercent(margin)}\n\nต้นทุนหลักคือ ${cost?.label ?? '—'} (${cost?.share ?? 0}%)`,
          citations: [],
          createdAt: yesterday,
        },
      ],
    },
    {
      id: newId('conv'),
      title: 'วางแผนลดต้นทุน',
      preview: `โฟกัส ${cost?.label ?? 'ต้นทุนหลัก'}`,
      updatedAt: earlier,
      group: 'ก่อนหน้านี้',
      avatars: ['AL', 'MK'],
      specialistRole: 'strategy',
      messages: [
        { id: 'msg_plan_user', role: 'user', content: 'วางแผนลดต้นทุนอย่างไรดี', createdAt: earlier },
        {
          id: 'msg_plan_ai',
          role: 'assistant',
          content: `เริ่มจาก ${cost?.label ?? 'ต้นทุนหลัก'} ซึ่งคิดเป็น ${cost?.share ?? 0}% ของต้นทุนรวม\n\n• ตั้งเป้าลด 3–5% ใน 30 วัน\n• วัดผลจากกำไรสุทธิและอัตรากำไร\n• จุดโฟกัส: ${profile.focusPoints[0]}`,
          citations: [],
          createdAt: earlier,
        },
      ],
    },
  ]
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  const rows = await db
    .query<Row>('SELECT data_json FROM conversations WHERE user_id = ? ORDER BY updated_at DESC')
    .all(userId)
  if (rows.length > 0) {
    return rows.map((row) => JSON.parse(row.data_json) as Conversation)
  }
  const seeded = await seedConversations(userId)
  await saveConversations(userId, seeded)
  return seeded
}

export async function saveConversations(userId: string, conversations: Conversation[]) {
  await db.batch([
    { sql: 'DELETE FROM conversations WHERE user_id = ?', params: [userId] },
    ...conversations.map((conversation) => ({
      sql: 'INSERT INTO conversations (id, user_id, data_json, updated_at) VALUES (?, ?, ?, ?)',
      params: [conversation.id, userId, JSON.stringify(conversation), conversation.updatedAt || new Date().toISOString()],
    })),
  ])
}
