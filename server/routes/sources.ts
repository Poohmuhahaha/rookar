import { Hono } from 'hono'
import { deleteSource, getSource, getSourceRows, listSources, setSourceIndustry } from '../services/sources'
import type { AppEnv } from '../types'

export const sourceRoutes = new Hono<AppEnv>()

sourceRoutes.get('/', async (c) => c.json({ sources: await listSources(c.get('user').id) }))

sourceRoutes.get('/:id', async (c) => {
  const source = await getSource(c.get('user').id, c.req.param('id'))
  if (!source) return c.json({ error: 'ไม่พบแหล่งข้อมูล' }, 404)
  return c.json({ source })
})

sourceRoutes.get('/:id/rows', async (c) => {
  const limit = Number(c.req.query('limit') ?? 2000)
  return c.json(await getSourceRows(c.get('user').id, c.req.param('id'), Number.isFinite(limit) ? limit : 2000))
})

sourceRoutes.delete('/:id', async (c) => {
  await deleteSource(c.get('user').id, c.req.param('id'))
  return c.json({ ok: true })
})

sourceRoutes.patch('/:id/industry', async (c) => {
  const body = await c.req.json().catch(() => null) as { industryId?: string | null } | null
  if (!body || !('industryId' in body)) return c.json({ error: 'ไม่พบข้อมูลอุตสาหกรรม' }, 400)
  const industryId = typeof body.industryId === 'string' && body.industryId.trim() ? body.industryId.trim() : null
  const source = await setSourceIndustry(c.get('user').id, c.req.param('id'), industryId)
  if (!source) return c.json({ error: 'ไม่พบแหล่งข้อมูลหรืออุตสาหกรรมไม่ถูกต้อง' }, 404)
  return c.json({ source })
})
