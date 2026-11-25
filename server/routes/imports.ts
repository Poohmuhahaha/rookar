import { Hono } from 'hono'
import { commitPreview, createPreview, validatePreview } from '../services/imports'
import type { AppEnv } from '../types'
import type { DataType } from '../../src/types'
import { enforceRateLimit, publicErrorMessage } from '../security'

export const importRoutes = new Hono<AppEnv>()

const types: DataType[] = ['sales', 'materials', 'labor', 'expenses']

importRoutes.post('/preview', async (c) => {
  const limited = await enforceRateLimit(c, `import:preview:${c.get('user').id}`, 20, 60 * 60 * 1000)
  if (limited) return limited
  const body = await c.req.parseBody()
  const file = body.file
  if (!(file instanceof File)) return c.json({ error: 'กรุณาแนบไฟล์ CSV' }, 400)
  const requested = typeof body.type === 'string' && types.includes(body.type as DataType) ? body.type as DataType : 'sales'
  try {
    const preview = await createPreview(c.get('user').id, file, requested)
    return c.json({ preview })
  } catch (error) {
    return c.json({ error: publicErrorMessage(error, 'อ่านไฟล์ไม่สำเร็จ') }, 400)
  }
})

importRoutes.post('/:id/validate', async (c) => {
  const body = await c.req.json().catch(() => null) as { mapping?: Record<string, string> } | null
  if (!body?.mapping) return c.json({ error: 'ไม่พบ mapping' }, 400)
  try {
    return c.json({ preview: await validatePreview(c.get('user').id, c.req.param('id'), body.mapping) })
  } catch (error) {
    return c.json({ error: publicErrorMessage(error, 'ตรวจสอบไม่สำเร็จ') }, 400)
  }
})

importRoutes.post('/:id/commit', async (c) => {
  const body = await c.req.json().catch(() => null) as {
    mapping?: Record<string, string>
    industryId?: string | null
  } | null
  if (!body?.mapping) return c.json({ error: 'ไม่พบ mapping' }, 400)
  if (body.industryId !== undefined && body.industryId !== null && typeof body.industryId !== 'string') {
    return c.json({ error: 'ข้อมูลอุตสาหกรรมไม่ถูกต้อง' }, 400)
  }
  try {
    return c.json({
      source: await commitPreview(c.get('user').id, c.req.param('id'), body.mapping, body.industryId ?? null),
    })
  } catch (error) {
    return c.json({ error: publicErrorMessage(error, 'นำเข้าไม่สำเร็จ') }, 400)
  }
})
