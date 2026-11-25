import { Hono } from 'hono'
import { db } from '../db'
import { nowIso } from '../auth'
import type { AppEnv } from '../types'
import type { AgentProfile } from '../../src/types'

export const agentRoutes = new Hono<AppEnv>()

agentRoutes.get('/', async (c) => {
  const row = await db.query<{ data_json: string }>('SELECT data_json FROM user_agents WHERE user_id = ?').get(c.get('user').id)
  if (!row) return c.json({ agents: null })
  try {
    return c.json({ agents: JSON.parse(row.data_json) as AgentProfile[] })
  } catch {
    return c.json({ agents: null })
  }
})

agentRoutes.put('/', async (c) => {
  const body = await c.req.json().catch(() => null) as { agents?: AgentProfile[] } | null
  if (!Array.isArray(body?.agents) || body.agents.length > 50) return c.json({ error: 'ข้อมูล Agent ไม่ถูกต้อง' }, 400)
  await db.query(
    `INSERT INTO user_agents (user_id, data_json, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET data_json = excluded.data_json, updated_at = excluded.updated_at`,
  ).run(c.get('user').id, JSON.stringify(body.agents), nowIso())
  return c.json({ ok: true })
})
