import { apiFetch, apiUrl } from './api/client'
import { getSession as getSessionState, setSession } from './session'
import type {
  AiStreamEvent,
  BusinessProfile,
  ChatMessage,
  Conversation,
  DashboardSummary,
  DataSource,
  DataType,
  ImportPreview,
  Session,
  SpecialistType,
} from '@/types'

export { getSession } from './session'

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

export async function login(email: string, password: string): Promise<Session> {
  const data = await apiFetch<{ session: Session }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setSession(data.session)
  return data.session
}

export async function signup(
  name: string,
  username: string,
  email: string,
  password: string,
): Promise<Session> {
  const data = await apiFetch<{ session: Session }>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, username, email, password }),
  })
  setSession(data.session)
  return data.session
}

export async function logout(): Promise<void> {
  try {
    await apiFetch<{ ok: true }>('/auth/logout', { method: 'POST' })
  } finally {
    setSession(null)
  }
}

export async function saveBusiness(profile: BusinessProfile): Promise<Session> {
  const data = await apiFetch<{ session: Session }>('/business', {
    method: 'PUT',
    body: JSON.stringify(profile),
  })
  setSession(data.session)
  return data.session
}

export async function skipBusiness(): Promise<Session> {
  const data = await apiFetch<{ session: Session }>('/business/skip', { method: 'POST' })
  setSession(data.session)
  return data.session
}

export async function listSources(): Promise<DataSource[]> {
  const data = await apiFetch<{ sources: DataSource[] }>('/sources')
  return data.sources
}

export async function setSourceIndustry(id: string, industryId: string | null): Promise<DataSource> {
  const data = await apiFetch<{ source: DataSource }>(`/sources/${encodeURIComponent(id)}/industry`, {
    method: 'PATCH',
    body: JSON.stringify({ industryId }),
  })
  return data.source
}

export async function getSourceById(id: string): Promise<DataSource | null> {
  try {
    const data = await apiFetch<{ source: DataSource }>(`/sources/${encodeURIComponent(id)}`)
    return data.source
  } catch {
    return null
  }
}

export async function getSourceRows(id: string): Promise<{
  columns: { key: string; label: string }[]
  rows: Record<string, string | number>[]
}> {
  return apiFetch(`/sources/${encodeURIComponent(id)}/rows`)
}

export async function deleteSource(id: string): Promise<void> {
  await apiFetch(`/sources/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function getDashboard(
  range: '3m' | '6m' | '12m',
  industryId?: string | null,
  lang: 'th' | 'en' = 'th',
): Promise<DashboardSummary | null> {
  const params = new URLSearchParams({ range, lang })
  if (industryId) params.set('industry', industryId)
  const data = await apiFetch<{ dashboard: DashboardSummary | null }>(`/dashboard?${params}`)
  return data.dashboard
}

export async function createImportPreview(file: File, type: DataType): Promise<ImportPreview> {
  const form = new FormData()
  form.set('file', file)
  form.set('type', type)
  const data = await apiFetch<{ preview: ImportPreview }>('/imports/preview', {
    method: 'POST',
    body: form,
  })
  return data.preview
}

export async function validateImport(
  previewId: string,
  mapping: Record<string, string>,
): Promise<ImportPreview> {
  const data = await apiFetch<{ preview: ImportPreview }>(`/imports/${encodeURIComponent(previewId)}/validate`, {
    method: 'POST',
    body: JSON.stringify({ mapping }),
  })
  return data.preview
}

export async function commitImport(
  preview: ImportPreview,
  mapping: Record<string, string> = {},
  industryId: string | null = null,
): Promise<DataSource> {
  if (!preview.previewId) throw new Error('ไม่พบ preview กรุณาตรวจสอบไฟล์ใหม่')
  const data = await apiFetch<{ source: DataSource }>(`/imports/${encodeURIComponent(preview.previewId)}/commit`, {
    method: 'POST',
    body: JSON.stringify({ mapping, industryId }),
  })
  return data.source
}

export async function requestPasswordReset(email: string): Promise<{ ok: boolean; devResetUrl?: string }> {
  return apiFetch('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await apiFetch('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  })
}

export async function resetAccountData(): Promise<void> {
  await apiFetch('/me/data', { method: 'DELETE' })
  await logout()
}

export async function getConversations(): Promise<Conversation[]> {
  const data = await apiFetch<{ conversations: Conversation[] }>('/conversations')
  return data.conversations
}

export function saveConversations(conversations: Conversation[]) {
  void apiFetch<{ ok: true }>('/conversations', {
    method: 'PUT',
    body: JSON.stringify({ conversations }),
  }).catch(() => undefined)
}

export type AiChatOptions = {
  industryId?: string | null
  language?: 'th' | 'en'
  specialistRole?: SpecialistType
  agentIds?: string[]
  history?: { role: 'user' | 'assistant'; content: string }[]
  attachment?: { name: string; content: string } | null
  conversationId?: string
  signal?: AbortSignal
}

export async function* streamAiReply(
  question: string,
  options: AiChatOptions = {},
): AsyncGenerator<AiStreamEvent> {
  const response = await fetch(apiUrl('/chat/stream'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/x-ndjson' },
    body: JSON.stringify({
      question,
      industry: options.industryId ?? undefined,
      language: options.language ?? 'th',
      specialistRole: options.specialistRole ?? 'general',
      agentIds: options.agentIds ?? [],
      history: options.history ?? [],
      attachment: options.attachment ?? null,
      conversationId: options.conversationId ?? undefined,
    }),
    signal: options.signal,
  })
  if (!response.ok) {
    const data = await response.json().catch(() => null) as { error?: string } | null
    throw new Error(data?.error ?? 'AI ไม่สามารถตอบได้ในขณะนี้')
  }
  if (!response.body) throw new Error('AI ไม่สามารถตอบได้ในขณะนี้')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.trim()) continue
      yield JSON.parse(line) as AiStreamEvent
    }
  }
  buffer += decoder.decode()
  if (buffer.trim()) yield JSON.parse(buffer) as AiStreamEvent
}

export function createMessage(role: 'user' | 'assistant', content = ''): ChatMessage {
  return {
    id: uid('msg'),
    role,
    content,
    streaming: role === 'assistant',
    citations: [],
    feedback: null,
    createdAt: new Date().toISOString(),
  }
}

export function createConversation(title: string): Conversation {
  return {
    id: uid('conv'),
    title,
    preview: '',
    updatedAt: new Date().toISOString(),
    group: 'วันนี้',
    messages: [],
  }
}
