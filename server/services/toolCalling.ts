import type { AiStreamEvent } from '../../src/types'
import { env } from '../env'
import {
  TOOL_MAP,
  TOOL_SCHEMAS,
  serializeToolResult,
  type ToolContext,
} from '../tools'

type ApiMessage =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: ToolCallPayload[] }
  | { role: 'tool'; tool_call_id: string; content: string }

type ToolCallPayload = {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

type ToolCall = {
  id: string
  name: string
  arguments: string
}

type CompletionEvent =
  | { type: 'token'; value: string }
  | { type: 'tool_calls'; calls: ToolCall[] }

type RunParams = {
  systemPrompt: string
  question: string
  history: { role: 'user' | 'assistant'; content: string }[]
  context: ToolContext
  sessionId?: string
  signal?: AbortSignal
}

const MAX_STEPS = 5
const REQUEST_TIMEOUT_MS = 90_000

async function* streamCompletion(
  messages: ApiMessage[],
  useTools: boolean,
  signal: AbortSignal | undefined,
  sessionId: string | undefined,
): AsyncGenerator<CompletionEvent> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  try {
    const body: Record<string, unknown> = {
      model: env.openaiModel,
      messages,
      stream: true,
      temperature: 0.3,
    }
    if (useTools) {
      body.tools = TOOL_SCHEMAS
      body.tool_choice = 'auto'
    }

    const response = await fetch(`${env.openaiBaseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.openaiApiKey}`,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        'User-Agent': env.openaiUserAgent,
        ...(sessionId ? { 'x-opencode-session': sessionId } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      throw new Error(`AI provider ตอบกลับ ${response.status}${detail ? `: ${detail.slice(0, 400)}` : ''}`)
    }
    if (!response.body) throw new Error('AI provider ไม่ได้ส่งข้อมูลกลับมา')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    const calls = new Map<number, ToolCall>()
    let buffer = ''

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const rawLine of lines) {
        const line = rawLine.trim()
        if (!line.startsWith('data:')) continue
        const payload = line.slice(5).trim()
        if (!payload || payload === '[DONE]') continue
        let parsed: {
          error?: { message?: string }
          choices?: {
            delta?: {
              content?: string
              tool_calls?: {
                index?: number
                id?: string
                function?: { name?: string; arguments?: string }
              }[]
            }
            finish_reason?: string | null
          }[]
        }
        try {
          parsed = JSON.parse(payload) as typeof parsed
        } catch {
          continue
        }
        if (parsed.error?.message) throw new Error(parsed.error.message)
        const delta = parsed.choices?.[0]?.delta
        if (typeof delta?.content === 'string' && delta.content) {
          yield { type: 'token', value: delta.content }
        }
        if (Array.isArray(delta?.tool_calls)) {
          for (const fragment of delta.tool_calls) {
            const index = fragment.index ?? 0
            const current = calls.get(index) ?? { id: '', name: '', arguments: '' }
            if (fragment.id) current.id = fragment.id
            if (fragment.function?.name) current.name = fragment.function.name
            if (fragment.function?.arguments) current.arguments += fragment.function.arguments
            calls.set(index, current)
          }
        }
      }
    }

    if (calls.size > 0) {
      yield {
        type: 'tool_calls',
        calls: [...calls.entries()]
          .filter(([, call]) => call.name)
          .map(([index, call]) => ({
            id: call.id || `call_${index}`,
            name: call.name,
            arguments: call.arguments || '{}',
          })),
      }
    }
  } finally {
    clearTimeout(timeout)
  }
}

function parseArguments(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw || '{}')
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {}
  } catch {
    return {}
  }
}

export async function* runToolCallingAgent(params: RunParams): AsyncGenerator<AiStreamEvent> {
  const messages: ApiMessage[] = [
    { role: 'system', content: params.systemPrompt },
    ...params.history.map((entry) => ({ role: entry.role, content: entry.content })),
    { role: 'user', content: params.question },
  ]

  for (let step = 0; step < MAX_STEPS; step += 1) {
    const allowTools = step < MAX_STEPS - 1
    let content = ''
    let pendingCalls: ToolCall[] = []

    try {
      for await (const event of streamCompletion(messages, allowTools, params.signal, params.sessionId)) {
        if (event.type === 'token') {
          content += event.value
          yield { type: 'token', value: event.value }
        } else {
          pendingCalls = event.calls
        }
      }
    } catch (error) {
      if (step === 0 && !params.signal?.aborted && !content) {
        for await (const event of streamCompletion(messages, false, params.signal, params.sessionId)) {
          if (event.type === 'token') yield { type: 'token', value: event.value }
        }
        return
      }
      throw error
    }

    if (pendingCalls.length === 0) return

    const prepared = pendingCalls.map((call) => {
      const tool = TOOL_MAP.get(call.name)
      return {
        call,
        tool,
        args: parseArguments(call.arguments),
      }
    })

    for (const item of prepared) {
      yield {
        type: 'tool_start',
        tool: {
          id: item.call.id,
          name: item.call.name,
          label: item.tool?.label ?? item.call.name,
          status: 'running',
        },
      }
    }

    const results = await Promise.all(
      prepared.map(async (item) => {
        if (!item.tool) {
          return {
            call: item.call,
            result: { summary: `ไม่พบ tool ชื่อ ${item.call.name}`, error: true },
          }
        }
        try {
          const result = await item.tool.execute(item.args, params.context)
          return { call: item.call, result }
        } catch (error) {
          return {
            call: item.call,
            result: {
              summary: error instanceof Error ? error.message : 'เรียก tool ไม่สำเร็จ',
              error: true,
            },
          }
        }
      }),
    )

    for (const item of results) {
      yield {
        type: 'tool_result',
        tool: {
          id: item.call.id,
          name: item.call.name,
          label: TOOL_MAP.get(item.call.name)?.label ?? item.call.name,
          status: item.result.error ? 'error' : 'done',
          summary: item.result.summary,
        },
      }
    }

    messages.push({
      role: 'assistant',
      content: content || null,
      tool_calls: prepared.map((item) => ({
        id: item.call.id,
        type: 'function',
        function: { name: item.call.name, arguments: item.call.arguments },
      })),
    })
    for (const item of results) {
      messages.push({
        role: 'tool',
        tool_call_id: item.call.id,
        content: serializeToolResult(item.result),
      })
    }
  }
}
