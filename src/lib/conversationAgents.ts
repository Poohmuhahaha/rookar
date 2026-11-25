import { agentsList } from './agentVault'
import type { AgentProfile, Conversation, SpecialistType } from '@/types'

export type ConversationAgent = {
  name: string
  color: string
  role?: string
}

const categoryByRole: Record<SpecialistType, AgentProfile['category'] | null> = {
  general: null,
  finance: 'finance',
  market: 'market',
  strategy: 'strategy',
  planning: 'operations',
}

export function conversationAgents(conversation: Conversation): ConversationAgent[] {
  const names = new Set<string>()

  for (const name of conversation.agentNames ?? []) {
    if (name) names.add(name)
  }

  for (const message of conversation.messages ?? []) {
    if (message.role !== 'assistant') continue
    if (message.answeredBy) names.add(message.answeredBy)
    for (const name of message.agentNames ?? []) {
      if (name) names.add(name)
    }
  }

  if (names.size === 0 && conversation.specialistRole) {
    const category = categoryByRole[conversation.specialistRole]
    if (category) {
      const match = agentsList.value.find((agent) => agent.category === category)
      if (match) names.add(match.name)
    }
  }

  const agents = [...names].map((name) => {
    const profile = agentsList.value.find((agent) => agent.name === name)
    return {
      name,
      color: profile?.color ?? '#18181b',
      role: profile?.role,
    }
  })

  return agents.slice(0, 6)
}
