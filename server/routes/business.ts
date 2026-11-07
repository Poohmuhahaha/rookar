import { Hono } from 'hono'
import { db } from '../db'
import { getBusiness, nowIso, toSession } from '../auth'
import type { AppEnv } from '../types'
import type { BusinessProfile } from '../../src/types'

export const businessRoutes = new Hono<AppEnv>()

businessRoutes.get('/', (c) => {
  const user = c.get('user')
  return c.json({ business: getBusiness(user.id) })
})

businessRoutes.put('/', async (c) => {
  const user = c.get('user')
  const body = await c.req.json().catch(() => null) as BusinessProfile | null
  if (!body?.name || !body.type) return c.json({ error: 'ข้อมูลธุรกิจไม่ครบ' }, 400)
  db.query(
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
  db.query('UPDATE users SET onboarding_complete = 1 WHERE id = ?').run(user.id)
  const updated = db.query('SELECT * FROM users WHERE id = ?').get(user.id)
  return c.json({ session: toSession(updated as never) })
})

businessRoutes.post('/skip', (c) => {
  const user = c.get('user')
  db.query('DELETE FROM businesses WHERE user_id = ?').run(user.id)
  db.query('UPDATE users SET onboarding_complete = 1 WHERE id = ?').run(user.id)
  const updated = db.query('SELECT * FROM users WHERE id = ?').get(user.id)
  return c.json({ session: toSession(updated as never) })
})
