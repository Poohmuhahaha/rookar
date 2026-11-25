import { Hono } from 'hono'
import { getMacroBenchmark } from '../services/macro'
import { getIndustryEconomics } from '../services/industryEconomics'
import type { AppEnv } from '../types'
import { clientIp, enforceRateLimit } from '../security'

export const macroRoutes = new Hono<AppEnv>()

macroRoutes.get('/', async (c) => {
  const limited = await enforceRateLimit(c, `macro:ip:${clientIp(c)}`, 30, 60 * 1000)
  if (limited) return limited
  if (c.req.query('force') === '1') {
    const forceLimited = await enforceRateLimit(c, `macro:force:ip:${clientIp(c)}`, 5, 60 * 60 * 1000)
    if (forceLimited) return forceLimited
  }
  try {
    const benchmark = await getMacroBenchmark({ force: c.req.query('force') === '1' })
    return c.json({ benchmark })
  } catch (error) {
    console.error('[macro] benchmark failed', error)
    return c.json({ error: 'ดึงข้อมูลไม่สำเร็จ' }, 502)
  }
})

macroRoutes.get('/industry', async (c) => {
  const limited = await enforceRateLimit(c, `industry:ip:${clientIp(c)}`, 30, 60 * 1000)
  if (limited) return limited
  try {
    const economics = await getIndustryEconomics(c.req.query('industry'))
    return c.json({ economics })
  } catch (error) {
    console.error('[macro] industry economics failed', error)
    return c.json({ error: 'ดึงข้อมูลอุตสาหกรรมไม่สำเร็จ' }, 502)
  }
})
