import { Hono } from 'hono'
import { getDashboard } from '../services/dashboard'
import type { AppEnv } from '../types'

export const dashboardRoutes = new Hono<AppEnv>()

dashboardRoutes.get('/', async (c) => {
  const range = c.req.query('range')
  const normalized = range === '3m' || range === '12m' ? range : '6m'
  const lang = c.req.query('lang') === 'en' ? 'en' : 'th'
  return c.json({ dashboard: await getDashboard(c.get('user').id, normalized, c.req.query('industry'), lang) })
})
