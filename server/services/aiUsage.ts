import { db } from '../db'

export type AiUsageCounters = {
  messages: number
  inputTokens: number
  outputTokens: number
}

export type AiLimits = {
  dailyMessages: number
  monthlyMessages: number
  dailyTotalTokens: number
  monthlyTotalTokens: number
  maxOutputTokens: number
}

type AiUsageRow = {
  period: string
  message_count: number
  input_tokens: number
  output_tokens: number
}

const PLAN_LIMITS: Record<string, AiLimits> = {
  Free: {
    dailyMessages: 30,
    monthlyMessages: 400,
    dailyTotalTokens: 1_000_000,
    monthlyTotalTokens: 10_000_000,
    maxOutputTokens: 1200,
  },
  Pro: {
    dailyMessages: 100,
    monthlyMessages: 2_000,
    dailyTotalTokens: 3_000_000,
    monthlyTotalTokens: 30_000_000,
    maxOutputTokens: 2000,
  },
  Enterprise: {
    dailyMessages: 500,
    monthlyMessages: 10_000,
    dailyTotalTokens: 10_000_000,
    monthlyTotalTokens: 100_000_000,
    maxOutputTokens: 3000,
  },
}

const DEFAULT_PLAN = 'Free'
const EMPTY: AiUsageCounters = { messages: 0, inputTokens: 0, outputTokens: 0 }

function normalizePlan(plan?: string | null): string {
  return plan && PLAN_LIMITS[plan] ? plan : DEFAULT_PLAN
}

export function getAiLimits(plan?: string | null): AiLimits {
  return PLAN_LIMITS[normalizePlan(plan)]
}

function periodKeys(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ''
  const year = value('year')
  const month = value('month')
  const day = value('day')
  return {
    day: `d:${year}-${month}-${day}`,
    month: `m:${year}-${month}`,
  }
}

export function estimateTokens(text: string): number {
  if (!text) return 0
  const thai = (text.match(/[\u0E00-\u0E7F]/g) ?? []).length
  const other = Math.max(0, text.length - thai)
  return Math.max(1, Math.ceil(thai * 0.9 + other / 3.5) + 4)
}

async function readUsage(userId: string): Promise<{ day: AiUsageCounters; month: AiUsageCounters }> {
  const keys = periodKeys()
  const rows = await db
    .query<AiUsageRow>('SELECT * FROM ai_usage WHERE user_id = ? AND period IN (?, ?)')
    .all(userId, keys.day, keys.month)

  const byPeriod = new Map(rows.map((row) => [row.period, row]))
  const toCounters = (row?: AiUsageRow): AiUsageCounters => row
    ? {
      messages: row.message_count,
      inputTokens: row.input_tokens,
      outputTokens: row.output_tokens,
    }
    : { ...EMPTY }

  return {
    day: toCounters(byPeriod.get(keys.day)),
    month: toCounters(byPeriod.get(keys.month)),
  }
}

export async function getAiUsage(userId: string, plan?: string | null) {
  const normalizedPlan = normalizePlan(plan)
  const limits = PLAN_LIMITS[normalizedPlan]
  const usage = await readUsage(userId)
  const remaining = {
    messagesToday: Math.max(0, limits.dailyMessages - usage.day.messages),
    messagesMonth: Math.max(0, limits.monthlyMessages - usage.month.messages),
    tokensToday: Math.max(0, limits.dailyTotalTokens - usage.day.inputTokens - usage.day.outputTokens),
    tokensMonth: Math.max(0, limits.monthlyTotalTokens - usage.month.inputTokens - usage.month.outputTokens),
  }
  return {
    plan: normalizedPlan,
    day: usage.day,
    month: usage.month,
    limits,
    remaining,
  }
}

export type AiQuotaResult = {
  allowed: boolean
  message?: string
  usage: Awaited<ReturnType<typeof getAiUsage>>
}

export async function checkAiQuota(
  userId: string,
  plan?: string | null,
  language: 'th' | 'en' = 'th',
): Promise<AiQuotaResult> {
  const usage = await getAiUsage(userId, plan)
  const { day, month, limits } = usage
  let reason = ''
  if (day.messages >= limits.dailyMessages) {
    reason = language === 'en'
      ? 'Your AI message quota for today is full. Please try again tomorrow.'
      : 'โควตาข้อความ AI วันนี้เต็มแล้ว กรุณาลองใหม่พรุ่งนี้'
  } else if (month.messages >= limits.monthlyMessages) {
    reason = language === 'en'
      ? 'Your monthly AI message quota is full.'
      : 'โควตาข้อความ AI เดือนนี้เต็มแล้ว'
  } else if (day.inputTokens + day.outputTokens >= limits.dailyTotalTokens) {
    reason = language === 'en'
      ? 'Your AI token quota for today is full. Please try again tomorrow.'
      : 'โควตา token AI วันนี้เต็มแล้ว กรุณาลองใหม่พรุ่งนี้'
  } else if (month.inputTokens + month.outputTokens >= limits.monthlyTotalTokens) {
    reason = language === 'en'
      ? 'Your monthly AI token quota is full.'
      : 'โควตา token AI เดือนนี้เต็มแล้ว'
  }
  return { allowed: !reason, message: reason || undefined, usage }
}

export async function recordAiUsage(userId: string, inputTokens: number, outputTokens: number): Promise<void> {
  const keys = periodKeys()
  const now = new Date().toISOString()
  const input = Math.max(0, Math.ceil(inputTokens))
  const output = Math.max(0, Math.ceil(outputTokens))
  await db.batch([
    {
      sql: `INSERT INTO ai_usage (user_id, period, message_count, input_tokens, output_tokens, updated_at)
            VALUES (?, ?, 1, ?, ?, ?)
            ON CONFLICT(user_id, period) DO UPDATE SET
              message_count = message_count + 1,
              input_tokens = input_tokens + excluded.input_tokens,
              output_tokens = output_tokens + excluded.output_tokens,
              updated_at = excluded.updated_at`,
      params: [userId, keys.day, input, output, now],
    },
    {
      sql: `INSERT INTO ai_usage (user_id, period, message_count, input_tokens, output_tokens, updated_at)
            VALUES (?, ?, 1, ?, ?, ?)
            ON CONFLICT(user_id, period) DO UPDATE SET
              message_count = message_count + 1,
              input_tokens = input_tokens + excluded.input_tokens,
              output_tokens = output_tokens + excluded.output_tokens,
              updated_at = excluded.updated_at`,
      params: [userId, keys.month, input, output, now],
    },
  ])
}
