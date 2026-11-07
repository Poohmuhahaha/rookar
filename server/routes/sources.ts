import { Hono } from 'hono'
import { deleteSource, getSource, getSourceRows, listSources, seedSources } from '../services/sources'
import type { AppEnv } from '../types'

export const sourceRoutes = new Hono<AppEnv>()

sourceRoutes.get('/', (c) => c.json({ sources: listSources(c.get('user').id) }))

sourceRoutes.get('/:id', (c) => {
  const source = getSource(c.get('user').id, c.req.param('id'))
  if (!source) return c.json({ error: 'ไม่พบแหล่งข้อมูล' }, 404)
  return c.json({ source })
})

sourceRoutes.get('/:id/rows', (c) => {
  return c.json(getSourceRows(c.get('user').id, c.req.param('id')))
})

sourceRoutes.delete('/:id', (c) => {
  deleteSource(c.get('user').id, c.req.param('id'))
  return c.json({ ok: true })
})

sourceRoutes.post('/seed', async (c) => {
  const body = await c.req.json().catch(() => ({})) as { industry?: string }
  const sources = seedSources(c.get('user').id, body.industry)
  return c.json({ sources })
})
