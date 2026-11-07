import { Hono } from 'hono'
import { getMacroBenchmark } from '../services/macro'
import type { AppEnv } from '../types'

export const macroRoutes = new Hono<AppEnv>()

macroRoutes.get('/', async (c) => {
  try {
    const benchmark = await getMacroBenchmark({ force: c.req.query('force') === '1' })
    return c.json({ benchmark })
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'ดึงข้อมูลไม่สำเร็จ' }, 502)
  }
})
