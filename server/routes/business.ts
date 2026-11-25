import { Hono } from 'hono'
import { db } from '../db'
import { getBusiness, nowIso, toSession } from '../auth'
import type { AppEnv } from '../types'
import type { BusinessProfile } from '../../src/types'
import type { DbUser } from '../db'

export const businessRoutes = new Hono<AppEnv>()

businessRoutes.get('/', async (c) => {
  const user = c.get('user')
  return c.json({ business: await getBusiness(user.id) })
})

businessRoutes.put('/', async (c) => {
  const user = c.get('user')
  const body = await c.req.json().catch(() => null) as BusinessProfile | null
  if (!body?.name || !body.type) return c.json({ error: 'ข้อมูลธุรกิจไม่ครบ' }, 400)
  if (body.name.length > 120 || body.type.length > 80) return c.json({ error: 'ข้อมูลธุรกิจยาวเกินไป' }, 400)
  if (body.goals !== undefined && (!Array.isArray(body.goals) || body.goals.length > 20 || body.goals.some((goal) => typeof goal !== 'string' || goal.length > 120))) {
    return c.json({ error: 'เป้าหมายธุรกิจไม่ถูกต้อง' }, 400)
  }
  await db.query(
    `INSERT INTO businesses (user_id, name, type, type_label, employees, revenue_range, goals_json, skipped, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       name = excluded.name, type = excluded.type, type_label = excluded.type_label,
       employees = excluded.employees, revenue_range = excluded.revenue_range,
       goals_json = excluded.goals_json, skipped = 0, updated_at = excluded.updated_at`,
  ).run(
    user.id,
    body.name,
    body.type,
    body.typeLabel || body.type,
    body.employees || '',
    body.revenueRange || '',
    JSON.stringify(body.goals ?? []),
    nowIso(),
  )
  await db.query('UPDATE users SET onboarding_complete = 1 WHERE id = ?').run(user.id)
  const updated = await db.query<DbUser>('SELECT * FROM users WHERE id = ?').get(user.id)
  if (!updated) return c.json({ error: 'ไม่พบผู้ใช้' }, 404)
  return c.json({ session: await toSession(updated) })
})

businessRoutes.post('/skip', async (c) => {
  const user = c.get('user')
  await db.query('DELETE FROM businesses WHERE user_id = ?').run(user.id)
  await db.query('UPDATE users SET onboarding_complete = 1 WHERE id = ?').run(user.id)
  const updated = await db.query<DbUser>('SELECT * FROM users WHERE id = ?').get(user.id)
  if (!updated) return c.json({ error: 'ไม่พบผู้ใช้' }, 404)
  return c.json({ session: await toSession(updated) })
})
