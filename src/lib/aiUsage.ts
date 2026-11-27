import { apiFetch } from './api/client'

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

export type AiUsage = {
  plan: string
  day: AiUsageCounters
  month: AiUsageCounters
  limits: AiLimits
  remaining: {
    messagesToday: number
    messagesMonth: number
    tokensToday: number
    tokensMonth: number
  }
}

export async function getAiUsage(): Promise<AiUsage> {
  const data = await apiFetch<{ usage: AiUsage }>('/ai/usage')
  return data.usage
}
