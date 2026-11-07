import { Hono } from 'hono'
import { commitPreview, createPreview, validatePreview } from '../services/imports'
import type { AppEnv } from '../types'
import type { DataType } from '../../src/types'

export const importRoutes = new Hono<AppEnv>()

const types: DataType[] = ['sales', 'materials', 'labor', 'expenses']

importRoutes.post('/preview', async (c) => {
  const body = await c.req.parseBody()
  const file = body.file
  if (!(file instanceof File)) return c.json({ error: 'กรุณาแนบไฟล์ CSV' }, 400)
  const requested = typeof body.type === 'string' && types.includes(body.type as DataType) ? body.type as DataType : 'sales'
  try {
    const preview = await createPreview(c.get('user').id, file, requested)
    return c.json({ preview })
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'อ่านไฟล์ไม่สำเร็จ' }, 400)
  }
})

importRoutes.post('/:id/validate', async (c) => {
  const body = await c.req.json().catch(() => null) as { mapping?: Record<string, string> } | null
  if (!body?.mapping) return c.json({ error: 'ไม่พบ mapping' }, 400)
  try {
    return c.json({ preview: validatePreview(c.get('user').id, c.req.param('id'), body.mapping) })
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'ตรวจสอบไม่สำเร็จ' }, 400)
  }
})

importRoutes.post('/:id/commit', async (c) => {
  const body = await c.req.json().catch(() => null) as { mapping?: Record<string, string> } | null
  if (!body?.mapping) return c.json({ error: 'ไม่พบ mapping' }, 400)
  try {
    return c.json({ source: commitPreview(c.get('user').id, c.req.param('id'), body.mapping) })
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'นำเข้าไม่สำเร็จ' }, 400)
  }
})
