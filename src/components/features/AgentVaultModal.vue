<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  Bot,
  Check,
  Flame,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  Users,
  Download,
  Sliders,
  Info,
  Lock,
  Globe,
  CheckSquare,
  Square,
  MessageSquare,
  ArrowLeft,
  Brain,
  Award,
  Database,
  Target,
  Lightbulb,
  FileText,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from '@lucide/vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import {
  agentsList,
  toggleAgentEnabled,
  createCustomAgent,
  deleteCustomAgent,
  updateAgentPermissions,
  isAgentAllowedInChat,
  generateCustomExpertiseLogic,
} from '@/lib/agentVault'
import type { AgentCategory, AgentPersonality, AgentProfile } from '@/types'
import { cn } from '@/lib/cn'

const props = withDefaults(
  defineProps<{
    open: boolean
    currentChatId?: string | null
    conversations?: { id: string; title: string; updatedAt?: string }[]
    initialAgentId?: string | null
  }>(),
  {
    currentChatId: null,
    conversations: () => [],
    initialAgentId: null,
  },
)

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

type ActiveTab = 'my-team' | 'vault' | 'create'
const currentTab = ref<ActiveTab>('my-team')

// Permission editor state
const editingAgent = ref<AgentProfile | null>(null)
const tempScope = ref<'all' | 'specific'>('all')
const tempAllowedChats = ref<string[]>([])

// Logic Inspector state
const inspectingAgent = ref<AgentProfile | null>(null)
const showSystemPrompt = ref(false)

watch(
  () => [props.open, props.initialAgentId],
  ([isOpen, id]) => {
    if (isOpen && id) {
      const match = agentsList.value.find((a) => a.id === id)
      if (match) {
        inspectingAgent.value = match
      }
    } else if (!isOpen) {
      inspectingAgent.value = null
      editingAgent.value = null
      showSystemPrompt.value = false
    }
  },
  { immediate: true },
)

function openLogicInspector(agent: AgentProfile) {
  inspectingAgent.value = agent
  showSystemPrompt.value = false
}

function closeLogicInspector() {
  inspectingAgent.value = null
  showSystemPrompt.value = false
}

function openPermissionEditor(agent: AgentProfile) {
  inspectingAgent.value = null
  editingAgent.value = agent
  tempScope.value = agent.chatScope || 'all'
  tempAllowedChats.value = [...(agent.allowedChatIds || [])]
}

function closePermissionEditor() {
  editingAgent.value = null
}

function savePermissions() {
  if (!editingAgent.value) return
  updateAgentPermissions(
    editingAgent.value.id,
    tempScope.value,
    tempAllowedChats.value,
  )
  editingAgent.value = null
}

function toggleChatPermission(chatId: string) {
  if (tempAllowedChats.value.includes(chatId)) {
    tempAllowedChats.value = tempAllowedChats.value.filter((id) => id !== chatId)
  } else {
    tempAllowedChats.value.push(chatId)
  }
}

function selectAllChats() {
  tempAllowedChats.value = props.conversations.map((c) => c.id)
}

function clearAllChats() {
  tempAllowedChats.value = []
}

// Vault filters
const searchQuery = ref('')
const selectedCategory = ref<string>('all')

const categories = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'finance', label: 'การเงิน & ต้นทุน' },
  { id: 'market', label: 'ตลาด & เศรษฐกิจ' },
  { id: 'strategy', label: 'กลยุทธ์ราคา' },
  { id: 'operations', label: 'บริหาร & ความเสี่ยง' },
  { id: 'marketing', label: 'การตลาดโซเชียล' },
]

const activeAgents = computed(() => agentsList.value.filter((a) => a.enabled))

const filteredVaultAgents = computed(() => {
  return agentsList.value.filter((agent) => {
    const matchesCategory =
      selectedCategory.value === 'all' || agent.category === selectedCategory.value
    const q = searchQuery.value.trim().toLowerCase()
    const matchesQuery =
      !q ||
      agent.name.toLowerCase().includes(q) ||
      agent.role.toLowerCase().includes(q) ||
      agent.description.toLowerCase().includes(q) ||
      agent.specialtyTags?.some((t) => t.toLowerCase().includes(q)) ||
      agent.creator.name.toLowerCase().includes(q)
    return matchesCategory && matchesQuery
  })
})

// Create agent form
const newName = ref('')
const newRole = ref('')
const newCategory = ref<AgentCategory>('finance')
const newPersonality = ref<AgentPersonality>('analytical')
const newDescription = ref('')
const newPrompt = ref('')
const newTags = ref('')
const customFramework = ref('')
const customWhySpecialized = ref('')

const personalities: { id: AgentPersonality; label: string; desc: string }[] = [
  { id: 'analytical', label: 'วิเคราะห์ตัวเลขลึก', desc: 'เน้นสูตรคำนวณ แม่นยำ อิงสถิติ' },
  { id: 'roast', label: 'ขวานผ่าซาก ไม่ประจบ 🔥', desc: 'สไตล์ Grok ชี้จุดรั่วไหลตรงๆ เตือนสติก่อนเจ๊ง' },
  { id: 'professional', label: 'ที่ปรึกษาสุภาพทางการ', desc: 'สุภาพ ชัดเจน ให้แนวคิดเชิงโครงสร้าง' },
  { id: 'creative', label: 'ครีเอทีฟ & กลยุทธ์ไวรัล', desc: 'เน้นไอเดียแปลกใหม่ การตลาด และการจัดเซ็ตเมนู' },
]

function handleCreateAgent() {
  if (!newName.value.trim() || !newRole.value.trim()) return

  const tags = newTags.value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  const personalityObj = personalities.find((p) => p.id === newPersonality.value)
  const categoryObj = categories.find((c) => c.id === newCategory.value)

  const partialAgent = {
    name: newName.value.trim(),
    role: newRole.value.trim(),
    category: newCategory.value,
    categoryLabel: categoryObj?.label ?? 'ทั่วไป',
    personality: newPersonality.value,
    personalityLabel: personalityObj?.label ?? 'วิเคราะห์แม่นยำ',
    description: newDescription.value.trim() || 'ผู้ช่วยเฉพาะทางประจำร้าน',
    systemPrompt: newPrompt.value.trim() || 'คุณคือผู้ช่วยเฉพาะทางสำหรับธุรกิจ ให้คำแนะนำอย่างเชี่ยวชาญ',
    color: '#000000',
    specialtyTags: tags.length ? tags : ['เฉพาะทาง'],
    enabled: true,
    chatScope: 'all' as const,
    allowedChatIds: [],
  }

  const generatedLogic = generateCustomExpertiseLogic(partialAgent)
  if (customFramework.value.trim()) {
    generatedLogic.reasoningFramework = customFramework.value.trim()
  }
  if (customWhySpecialized.value.trim()) {
    generatedLogic.whySpecialized = customWhySpecialized.value.trim()
  }

  createCustomAgent({
    ...partialAgent,
    expertiseLogic: generatedLogic,
  })

  // Reset form
  newName.value = ''
  newRole.value = ''
  newDescription.value = ''
  newPrompt.value = ''
  newTags.value = ''
  customFramework.value = ''
  customWhySpecialized.value = ''
  currentTab.value = 'my-team'
}
</script>

<template>
  <AppModal
    :open="open"
    title="บอร์ดบริหารและคลังผู้ช่วย AI (Agent Vault)"
    size="xl"
    @update:open="emit('update:open', $event)"
  >
    <template #default>
      <!-- LOGIC & COMPETENCY INSPECTOR SUBVIEW -->
      <div v-if="inspectingAgent" class="space-y-4">
        <!-- Top bar: Back and Title -->
        <div class="flex items-center justify-between border-b border-black/[0.06] pb-3">
          <button
            type="button"
            class="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink transition"
            @click="closeLogicInspector"
          >
            <ArrowLeft class="h-3.5 w-3.5" />
            กลับไปหน้ารวม
          </button>
          <div class="flex items-center gap-2">
            <span
              class="h-2.5 w-2.5 rounded-full"
              :style="{ backgroundColor: inspectingAgent.color }"
            />
            <h3 class="text-sm font-bold text-ink">Logic & ความเชี่ยวชาญ: {{ inspectingAgent.name }}</h3>
          </div>
        </div>

        <!-- Agent Header Identity Card -->
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-neutral-50 p-4 border border-black/[0.04]">
          <div class="flex items-center gap-3">
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white font-bold text-base shadow-xs"
              :style="{ backgroundColor: inspectingAgent.color }"
            >
              {{ inspectingAgent.name.charAt(0) }}
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-1.5">
                <h4 class="text-sm font-bold text-ink">{{ inspectingAgent.name }}</h4>
                <span
                  v-if="inspectingAgent.creator.isOfficial"
                  class="rounded bg-neutral-200/80 px-2 py-0.5 text-[10px] font-semibold text-ink"
                >
                  Official
                </span>
                <span
                  v-else-if="inspectingAgent.isCustom"
                  class="rounded bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700"
                >
                  กำหนดเอง
                </span>
                <span class="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-muted border border-black/[0.04]">
                  {{ inspectingAgent.categoryLabel }}
                </span>
                <span
                  :class="[
                    'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                    inspectingAgent.personality === 'roast'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-neutral-200/60 text-ink',
                  ]"
                >
                  {{ inspectingAgent.personalityLabel }}
                </span>
              </div>
              <p class="text-xs font-medium text-muted mt-0.5">{{ inspectingAgent.role }}</p>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button
              type="button"
              :class="[
                'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition',
                inspectingAgent.enabled
                  ? 'bg-black text-white hover:bg-neutral-800'
                  : 'bg-neutral-200 text-ink hover:bg-black hover:text-white',
              ]"
              @click="toggleAgentEnabled(inspectingAgent.id)"
            >
              <Check v-if="inspectingAgent.enabled" class="h-3.5 w-3.5 text-white" />
              <Plus v-else class="h-3.5 w-3.5" />
              <span>{{ inspectingAgent.enabled ? 'เปิดใช้งานในทีมแล้ว' : '+ เพิ่มเข้าทีม' }}</span>
            </button>
          </div>
        </div>

        <!-- Section 1: Why Specialized (Callout Box) -->
        <div class="rounded-2xl bg-amber-50/70 p-4 border border-amber-200/70">
          <div class="flex items-center gap-2 text-amber-900 font-bold text-xs mb-1.5">
            <Lightbulb class="h-4 w-4 text-amber-600 shrink-0 fill-amber-500" />
            <span>ทำไม Agent ตัวนี้ถึงเก่งและเชี่ยวชาญกว่า AI ทั่วไป?</span>
          </div>
          <p class="text-xs text-amber-950 leading-relaxed font-medium">
            {{ inspectingAgent.expertiseLogic?.whySpecialized }}
          </p>
        </div>

        <!-- Section 2: Reasoning Framework & Benchmark Score (2 columns) -->
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <!-- Framework Box -->
          <div class="rounded-2xl border border-black/[0.06] bg-white p-4">
            <div class="flex items-center gap-2 text-xs font-bold text-ink mb-1.5">
              <Brain class="h-4 w-4 text-brand-700" />
              <span>ตรรกะ & Framework การคิด (Reasoning)</span>
            </div>
            <p class="text-[11px] text-muted mb-2.5">
              อัลกอริทึมและโมเดลทฤษฎีธุรกิจที่ระบบใช้กำกับการวิเคราะห์:
            </p>
            <div class="rounded-xl bg-neutral-100 p-2.5 font-mono text-xs font-semibold text-ink leading-relaxed">
              {{ inspectingAgent.expertiseLogic?.reasoningFramework }}
            </div>
          </div>

          <!-- Benchmark Box -->
          <div class="rounded-2xl border border-black/[0.06] bg-white p-4">
            <div class="flex items-center gap-2 text-xs font-bold text-ink mb-1.5">
              <Award class="h-4 w-4 text-emerald-600" />
              <span>ดัชนีชี้วัดและการทดสอบจริง (Benchmark)</span>
            </div>
            <div class="flex items-baseline gap-2 mt-1">
              <span class="text-2xl font-black text-emerald-600 tracking-tight">
                {{ inspectingAgent.expertiseLogic?.benchmarkScore.score }}
              </span>
              <span class="text-xs font-bold text-ink">
                {{ inspectingAgent.expertiseLogic?.benchmarkScore.label }}
              </span>
            </div>
            <p class="text-[11px] text-muted mt-1 leading-relaxed">
              {{ inspectingAgent.expertiseLogic?.benchmarkScore.metric }}
            </p>
          </div>
        </div>

        <!-- Section 3: Grounded Knowledge Base -->
        <div class="rounded-2xl border border-black/[0.06] bg-white p-4">
          <div class="flex items-center gap-2 text-xs font-bold text-ink mb-1">
            <Database class="h-4 w-4 text-blue-600" />
            <span>คลังข้อมูลอ้างอิง & กฎเกณฑ์ที่ใช้เทียบเคียง (Grounded Knowledge)</span>
          </div>
          <p class="text-[11px] text-muted mb-3">
            Agent ตัวนี้ไม่ได้ใช้การคาดเดา แต่เชื่อมโยงและอ้างอิงจากฐานข้อมูลและมาตรฐานต่อไปนี้:
          </p>
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div
              v-for="(kb, idx) in inspectingAgent.expertiseLogic?.knowledgeBase || []"
              :key="idx"
              class="flex items-start gap-2 rounded-xl bg-neutral-50 p-2.5 text-xs text-ink border border-black/[0.03]"
            >
              <ShieldCheck class="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
              <span class="font-medium text-[11.5px] leading-snug">{{ kb }}</span>
            </div>
          </div>
        </div>

        <!-- Section 4: Core Operational Strengths -->
        <div class="rounded-2xl border border-black/[0.06] bg-white p-4">
          <div class="flex items-center gap-2 text-xs font-bold text-ink mb-2.5">
            <Target class="h-4 w-4 text-purple-600" />
            <span>ขีดความสามารถเฉพาะทาง (Operational Capabilities)</span>
          </div>
          <div class="space-y-2">
            <div
              v-for="(strength, idx) in inspectingAgent.expertiseLogic?.coreStrengths || []"
              :key="idx"
              class="flex items-center gap-2.5 text-xs text-ink"
            >
              <div class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Check class="h-2.5 w-2.5 stroke-[3]" />
              </div>
              <span class="font-medium">{{ strength }}</span>
            </div>
          </div>
        </div>

        <!-- Section 5: Collapsible System Prompt View -->
        <div class="rounded-2xl border border-black/[0.06] bg-white overflow-hidden">
          <button
            type="button"
            class="flex w-full items-center justify-between p-3.5 text-xs font-semibold text-muted hover:text-ink transition hover:bg-neutral-50 text-left"
            @click="showSystemPrompt = !showSystemPrompt"
          >
            <div class="flex items-center gap-2">
              <FileText class="h-3.5 w-3.5 text-neutral-400" />
              <span>ดูคำสั่งควบคุมพฤติกรรมเบื้องหลัง (System Prompt & Guardrails)</span>
            </div>
            <component :is="showSystemPrompt ? ChevronUp : ChevronDown" class="h-3.5 w-3.5" />
          </button>
          <div v-if="showSystemPrompt" class="border-t border-black/[0.06] bg-neutral-900 p-3.5 text-[11px] font-mono text-neutral-200 whitespace-pre-wrap leading-relaxed">
            {{ inspectingAgent.systemPrompt }}
          </div>
        </div>

        <!-- Footer Actions in Inspector -->
        <div class="flex items-center justify-between pt-3 border-t border-black/[0.06]">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:bg-neutral-50 transition"
            @click="openPermissionEditor(inspectingAgent)"
          >
            <Lock class="h-3 w-3 text-muted" />
            <span>ตั้งค่าสิทธิ์ห้องแชทของตัวนี้</span>
          </button>

          <AppButton size="sm" @click="closeLogicInspector">
            ตกลง / ปิดหน้าต่าง
          </AppButton>
        </div>
      </div>

      <!-- PERMISSION EDITOR SUBVIEW -->
      <div v-else-if="editingAgent" class="space-y-4">
        <div class="flex items-center justify-between border-b border-black/[0.06] pb-3">
          <button
            type="button"
            class="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink transition"
            @click="closePermissionEditor"
          >
            <ArrowLeft class="h-3.5 w-3.5" />
            กลับไปหน้ารวม
          </button>
          <div class="flex items-center gap-2">
            <span
              class="h-2.5 w-2.5 rounded-full"
              :style="{ backgroundColor: editingAgent.color }"
            />
            <h3 class="text-sm font-bold text-ink">จัดการสิทธิ์ห้องแชท: {{ editingAgent.name }}</h3>
          </div>
        </div>

        <p class="text-xs text-muted leading-relaxed">
          กำหนดว่า Agent ตัวนี้ได้รับอนุญาตให้เข้าร่วมประชุมและอ่าน/ตอบคำถามในห้องแชทใดบ้าง เพื่อแยกขอบเขตงาน เช่น บัญชีภาษีให้เข้าเฉพาะแชทการเงิน
        </p>

        <!-- Scope Selection -->
        <div class="space-y-2.5 pt-1">
          <label
            :class="[
              'flex items-start gap-3 rounded-2xl p-3.5 border transition cursor-pointer',
              tempScope === 'all'
                ? 'bg-black/5 border-black text-ink'
                : 'bg-white border-black/[0.06] text-muted hover:border-black/20',
            ]"
          >
            <input
              v-model="tempScope"
              type="radio"
              value="all"
              class="mt-0.5"
            />
            <div>
              <div class="flex items-center gap-1.5">
                <Globe class="h-3.5 w-3.5 text-brand-700" />
                <span class="text-xs font-bold text-ink">เข้าถึงได้ทุกห้องแชท (All Chats)</span>
              </div>
              <p class="text-[11px] text-muted mt-0.5">
                Agent จะพร้อมให้คำปรึกษาในทุกการสนทนาของระบบโดยไม่มีข้อจำกัด
              </p>
            </div>
          </label>

          <label
            :class="[
              'flex items-start gap-3 rounded-2xl p-3.5 border transition cursor-pointer',
              tempScope === 'specific'
                ? 'bg-black/5 border-black text-ink'
                : 'bg-white border-black/[0.06] text-muted hover:border-black/20',
            ]"
          >
            <input
              v-model="tempScope"
              type="radio"
              value="specific"
              class="mt-0.5"
            />
            <div class="flex-1">
              <div class="flex items-center gap-1.5">
                <Lock class="h-3.5 w-3.5 text-amber-600" />
                <span class="text-xs font-bold text-ink">จำกัดเฉพาะห้องแชทที่กำหนด (Selected Chats)</span>
                <span
                  v-if="tempScope === 'specific'"
                  class="ml-auto rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.2"
                >
                  เลือกไว้ {{ tempAllowedChats.length }} ห้อง
                </span>
              </div>
              <p class="text-[11px] text-muted mt-0.5">
                Agent จะถูกเรียกใช้เฉพาะในการสนทนาที่คุณอนุญาตเท่านั้น (ห้องแชทอื่นจะไม่เห็น Agent ตัวนี้)
              </p>
            </div>
          </label>
        </div>

        <!-- Conversation Checklist (visible when specific is selected) -->
        <div v-if="tempScope === 'specific'" class="pt-2 space-y-2">
          <div class="flex items-center justify-between text-xs font-semibold px-1 text-ink">
            <span>เลือกห้องแชทที่อนุญาต:</span>
            <div class="flex items-center gap-3 text-[11px]">
              <button
                type="button"
                class="text-brand-700 hover:underline"
                @click="selectAllChats"
              >
                เลือกทั้งหมด
              </button>
              <span class="text-neutral-300">|</span>
              <button
                type="button"
                class="text-muted hover:text-ink"
                @click="clearAllChats"
              >
                ล้างทั้งหมด
              </button>
            </div>
          </div>

          <div v-if="conversations.length === 0" class="rounded-xl bg-neutral-50 p-6 text-center text-xs text-muted">
            ยังไม่มีประวัติการสนทนาในระบบ (เมื่อเริ่มสนทนาใหม่ คุณสามารถกลับมากำหนดสิทธิ์ได้ที่นี่)
          </div>

          <div v-else class="max-h-60 overflow-y-auto rounded-xl border border-black/[0.08] divide-y divide-black/[0.04] bg-white">
            <div
              v-for="chat in conversations"
              :key="chat.id"
              :class="[
                'flex items-center justify-between p-3 text-xs transition cursor-pointer hover:bg-neutral-50',
                tempAllowedChats.includes(chat.id) ? 'bg-black/[0.02]' : '',
                chat.id === currentChatId ? 'ring-1 ring-inset ring-brand-500/20' : '',
              ]"
              @click="toggleChatPermission(chat.id)"
            >
              <div class="flex items-center gap-2.5 min-w-0 pr-3">
                <component
                  :is="tempAllowedChats.includes(chat.id) ? CheckSquare : Square"
                  :class="[
                    'h-4 w-4 shrink-0 transition',
                    tempAllowedChats.includes(chat.id) ? 'text-black' : 'text-neutral-300',
                  ]"
                />
                <div class="min-w-0">
                  <p class="font-semibold text-ink truncate">{{ chat.title }}</p>
                  <p class="text-[10px] text-muted truncate mt-0.5">
                    ID: {{ chat.id.slice(0, 8) }}...
                    <span v-if="chat.id === currentChatId" class="text-brand-700 font-bold ml-1">· แชทที่กำลังเปิดอยู่</span>
                  </p>
                </div>
              </div>

              <span
                :class="[
                  'shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full',
                  tempAllowedChats.includes(chat.id)
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-neutral-100 text-muted',
                ]"
              >
                {{ tempAllowedChats.includes(chat.id) ? 'อนุญาตแล้ว' : 'ปิดสิทธิ์' }}
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-4 border-t border-black/[0.06]">
          <AppButton variant="secondary" size="sm" @click="closePermissionEditor">
            ยกเลิก
          </AppButton>
          <AppButton size="sm" @click="savePermissions">
            บันทึกการตั้งค่าสิทธิ์
          </AppButton>
        </div>
      </div>

      <!-- MAIN TABS VIEW -->
      <div v-else>
        <!-- Subtitle description -->
        <p class="text-xs text-muted -mt-2 mb-4 leading-relaxed">
          จัดทัพที่ปรึกษา AI ร่วมวิเคราะห์ธุรกิจของคุณ, ดูตรรกะความเชี่ยวชาญเฉพาะด้าน (Competency Logic), กำหนดสิทธิ์แยกตามห้องแชท, หรือเลือกนำเข้า Agent สำเร็จรูป
        </p>

        <!-- Tab Buttons -->
        <div class="flex items-center justify-between border-b border-black/[0.06] pb-3 gap-2">
          <div class="inline-flex rounded-full bg-neutral-100 p-1">
            <button
              type="button"
              :class="[
                'flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition',
                currentTab === 'my-team'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-muted hover:text-ink',
              ]"
              @click="currentTab = 'my-team'"
            >
              <Users class="h-3.5 w-3.5" />
              ทีมของฉัน
              <span
                :class="[
                  'ml-1 inline-flex items-center justify-center rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                  currentTab === 'my-team' ? 'bg-white/20 text-white' : 'bg-neutral-200 text-ink',
                ]"
              >
                {{ activeAgents.length }}
              </span>
            </button>

            <button
              type="button"
              :class="[
                'flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition',
                currentTab === 'vault'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-muted hover:text-ink',
              ]"
              @click="currentTab = 'vault'"
            >
              <Sparkles class="h-3.5 w-3.5" />
              คลัง Agent ชุมชน (Vault)
              <span class="text-[10px] opacity-75">({{ agentsList.length }})</span>
            </button>
          </div>

          <AppButton
            v-if="currentTab !== 'create'"
            size="sm"
            variant="secondary"
            @click="currentTab = 'create'"
          >
            <template #left>
              <Plus class="h-3.5 w-3.5" />
            </template>
            สร้าง Agent ของฉัน
          </AppButton>
        </div>

        <!-- TAB 1: MY ACTIVE TEAM -->
        <div v-if="currentTab === 'my-team'" class="pt-4 space-y-3">
          <div class="flex items-center justify-between px-1">
            <p class="text-xs font-medium text-ink">
              เปิดใช้งานอยู่ <strong class="text-black font-bold">{{ activeAgents.length }}</strong> ตัว จากทั้งหมด {{ agentsList.length }} ตัว
              <span class="text-muted font-normal">(คลิก <strong class="text-amber-800">💡 ทำไมถึงเก่งด้านนี้?</strong> เพื่อตรวจดู Logic ความเชี่ยวชาญ)</span>
            </p>
          </div>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div
              v-for="agent in agentsList"
              :key="agent.id"
              :class="[
                'relative flex flex-col justify-between rounded-2xl p-4 transition border',
                agent.enabled
                  ? 'bg-white border-black/10 shadow-xs'
                  : 'bg-neutral-50/70 border-dashed border-neutral-200 opacity-60',
              ]"
            >
              <div>
                <div class="flex items-start justify-between gap-3">
                  <div class="flex items-center gap-2.5">
                    <div
                      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white font-bold text-xs"
                      :style="{ backgroundColor: agent.color }"
                    >
                      {{ agent.name.charAt(0) }}
                    </div>
                    <div>
                      <div class="flex items-center gap-1.5">
                        <h4 class="text-[13px] font-bold text-ink leading-tight">{{ agent.name }}</h4>
                        <span
                          v-if="agent.creator.isOfficial"
                          class="rounded bg-neutral-100 px-1.5 py-0.5 text-[9px] font-semibold text-muted"
                        >
                          Official
                        </span>
                        <span
                          v-else-if="agent.isCustom"
                          class="rounded bg-brand-50 px-1.5 py-0.5 text-[9px] font-semibold text-brand-700"
                        >
                          กำหนดเอง
                        </span>
                      </div>
                      <p class="text-[11px] font-medium text-muted mt-0.5">{{ agent.role }}</p>
                    </div>
                  </div>

                  <!-- Custom Switch Toggle -->
                  <button
                    type="button"
                    :class="[
                      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                      agent.enabled ? 'bg-black' : 'bg-neutral-300',
                    ]"
                    :aria-checked="agent.enabled"
                    role="switch"
                    title="เปิด/ปิดการใช้งาน"
                    @click="toggleAgentEnabled(agent.id)"
                  >
                    <span
                      :class="[
                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                        agent.enabled ? 'translate-x-5' : 'translate-x-0',
                      ]"
                    />
                  </button>
                </div>

                <p class="mt-2.5 text-xs leading-relaxed text-muted line-clamp-2">
                  {{ agent.description }}
                </p>

                <!-- Tags, Permission Status & Logic Button -->
                <div class="mt-3 flex flex-wrap items-center gap-1.5">
                  <span
                    :class="[
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      agent.personality === 'roast'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-neutral-100 text-ink',
                    ]"
                  >
                    {{ agent.personalityLabel }}
                  </span>

                  <!-- Chat Scope Permission Pill -->
                  <button
                    type="button"
                    :class="[
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border transition',
                      agent.chatScope === 'specific'
                        ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100',
                    ]"
                    title="คลิกเพื่อจัดการสิทธิ์ห้องแชท"
                    @click="openPermissionEditor(agent)"
                  >
                    <component
                      :is="agent.chatScope === 'specific' ? Lock : Globe"
                      class="h-2.5 w-2.5"
                    />
                    <span>
                      {{
                        agent.chatScope === 'specific'
                          ? `เฉพาะ ${agent.allowedChatIds?.length || 0} แชท`
                          : 'ทุกแชท'
                      }}
                    </span>
                  </button>

                  <!-- Direct Logic Button -->
                  <button
                    type="button"
                    class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200/60 hover:bg-amber-100 transition"
                    title="คลิกเพื่อตรวจดู Logic และเหตุผลที่ Agent ตัวนี้เชี่ยวชาญด้านนี้"
                    @click="openLogicInspector(agent)"
                  >
                    <Lightbulb class="h-2.5 w-2.5 text-amber-600 fill-amber-500" />
                    <span>ทำไมถึงเก่งด้านนี้?</span>
                  </button>
                </div>
              </div>

              <div class="mt-3 pt-2.5 border-t border-black/[0.04] flex items-center justify-between text-[11px] text-muted">
                <div class="flex items-center gap-2">
                  <span>{{ agent.creator.name }}</span>
                  <span
                    v-if="currentChatId && isAgentAllowedInChat(agent, currentChatId)"
                    class="text-[10px] text-emerald-700 font-semibold"
                  >
                    · ใช้งานได้ในแชทนี้
                  </span>
                  <span
                    v-else-if="currentChatId && !isAgentAllowedInChat(agent, currentChatId) && agent.enabled"
                    class="text-[10px] text-amber-700 font-semibold"
                  >
                    · จำกัดสิทธิ์ในแชทนี้
                  </span>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="text-xs font-semibold text-ink-soft hover:text-black hover:underline"
                    @click="openPermissionEditor(agent)"
                  >
                    ตั้งค่าสิทธิ์
                  </button>
                  <button
                    v-if="agent.isCustom"
                    type="button"
                    class="text-red-500 hover:text-red-700 transition"
                    title="ลบ Agent นี้"
                    @click="deleteCustomAgent(agent.id)"
                  >
                    <Trash2 class="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 2: AGENT VAULT (COMMUNITY & STORE) -->
        <div v-else-if="currentTab === 'vault'" class="pt-4 space-y-4">
          <!-- Search and Filter Bar -->
          <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div class="relative flex-1">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="ค้นหาชื่อ Agent, ผู้สร้าง, หรือความเชี่ยวชาญ..."
                class="w-full rounded-full bg-neutral-100 pl-9 pr-4 py-1.5 text-xs text-ink placeholder:text-muted focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              <button
                v-for="cat in categories"
                :key="cat.id"
                type="button"
                :class="[
                  'whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold transition',
                  selectedCategory === cat.id
                    ? 'bg-black text-white'
                    : 'bg-neutral-100 text-muted hover:text-ink',
                ]"
                @click="selectedCategory = cat.id"
              >
                {{ cat.label }}
              </button>
            </div>
          </div>

          <!-- Vault Cards Grid -->
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div
              v-for="agent in filteredVaultAgents"
              :key="agent.id"
              class="flex flex-col justify-between rounded-2xl bg-white p-4 border border-black/[0.06] shadow-xs hover:border-black/20 transition"
            >
              <div>
                <div class="flex items-start justify-between gap-2">
                  <div class="flex items-center gap-2.5">
                    <div
                      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white font-bold text-sm"
                      :style="{ backgroundColor: agent.color }"
                    >
                      {{ agent.name.charAt(0) }}
                    </div>
                    <div>
                      <div class="flex items-center gap-1.5">
                        <h4 class="text-[13px] font-bold text-ink leading-tight">{{ agent.name }}</h4>
                        <span
                          v-if="agent.creator.isOfficial"
                          class="rounded bg-neutral-100 px-1.5 py-0.2 text-[9px] font-semibold text-muted"
                        >
                          Official
                        </span>
                      </div>
                      <p class="text-[11px] font-medium text-muted mt-0.5">{{ agent.role }}</p>
                    </div>
                  </div>

                  <div class="flex items-center gap-1 text-[11px] font-bold text-amber-600">
                    <Star class="h-3 w-3 fill-amber-500 text-amber-500" />
                    {{ agent.rating?.toFixed(1) || '5.0' }}
                  </div>
                </div>

                <p class="mt-2.5 text-xs leading-relaxed text-muted">
                  {{ agent.description }}
                </p>

                <!-- Tags & Logic Button -->
                <div class="mt-3 flex flex-wrap items-center gap-1.5">
                  <span
                    :class="[
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      agent.personality === 'roast'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-neutral-100 text-ink',
                    ]"
                  >
                    {{ agent.personalityLabel }}
                  </span>
                  <span
                    v-for="tag in (agent.specialtyTags || []).slice(0, 2)"
                    :key="tag"
                    class="rounded-full bg-neutral-50 px-2 py-0.5 text-[10px] text-muted border border-black/[0.04]"
                  >
                    #{{ tag }}
                  </span>

                  <button
                    type="button"
                    class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200/60 hover:bg-amber-100 transition"
                    title="คลิกเพื่อตรวจดู Logic ความเชี่ยวชาญของ Agent นี้"
                    @click="openLogicInspector(agent)"
                  >
                    <Lightbulb class="h-2.5 w-2.5 text-amber-600 fill-amber-500" />
                    <span>ทำไมถึงเก่ง?</span>
                  </button>
                </div>
              </div>

              <!-- Footer & Action -->
              <div class="mt-4 pt-3 border-t border-black/[0.04] flex items-center justify-between">
                <div class="text-[11px] text-muted">
                  <span>{{ agent.creator.name }}</span>
                  <span class="mx-1">·</span>
                  <span>{{ agent.downloads }} ใช้งาน</span>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="text-xs font-semibold text-amber-700 hover:text-amber-900 hover:underline flex items-center gap-1"
                    @click="openLogicInspector(agent)"
                  >
                    <Lightbulb class="h-3 w-3" />
                    <span>Logic</span>
                  </button>

                  <button
                    type="button"
                    :class="[
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition',
                      agent.enabled
                        ? 'bg-black text-white hover:bg-neutral-800'
                        : 'bg-neutral-100 text-ink hover:bg-black hover:text-white',
                    ]"
                    @click="toggleAgentEnabled(agent.id)"
                  >
                    <Check v-if="agent.enabled" class="h-3 w-3 text-white" />
                    <Plus v-else class="h-3 w-3" />
                    {{ agent.enabled ? 'อยู่ในทีมแล้ว' : '+ เพิ่มเข้าทีม' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 3: CREATE CUSTOM AGENT FORM -->
        <div v-else class="pt-4 max-w-xl mx-auto space-y-4">
          <div class="text-center pb-2">
            <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white font-bold text-lg mb-2">
              AI
            </div>
            <h3 class="text-base font-bold text-ink">สร้าง Agent ผู้เชี่ยวชาญเฉพาะทางของคุณเอง</h3>
            <p class="text-xs text-muted mt-0.5">
              กำหนดบทบาท นิสัยเฉพาะ และโจทย์ธุรกิจที่ต้องการให้ Agent ช่วยคิดวิเคราะห์
            </p>
          </div>

          <!-- Competency Notice Banner -->
          <div class="rounded-2xl bg-brand-50/70 p-3.5 border border-brand-200/60 text-xs text-brand-900 flex items-start gap-2.5">
            <Lightbulb class="h-4 w-4 text-brand-600 shrink-0 mt-0.5 fill-brand-400" />
            <div>
              <p class="font-bold">ระบบ AI Competency Engine จะสร้าง Logic ให้ Agent ตัวนี้อัตโนมัติ</p>
              <p class="text-[11px] text-brand-800 mt-0.5">
                ทั้ง Framework การคิด, ชุดข้อมูลอ้างอิง, และตัวชี้วัดความแม่นยำ เพื่อให้พร้อมเข้าร่วมบอร์ดบริหารทันที
              </p>
            </div>
          </div>

          <form class="space-y-3" @submit.prevent="handleCreateAgent">
            <div>
              <label class="block text-xs font-semibold text-ink mb-1">ชื่อ Agent</label>
              <input
                v-model="newName"
                type="text"
                required
                placeholder="เช่น น้องส้มหยุด เซฟต้นทุนชาบู, พี่ต่อ ยิงแอด TikTok"
                class="w-full rounded-xl bg-neutral-100 px-3 py-2 text-xs text-ink placeholder:text-muted focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-ink mb-1">บทบาท / ตำแหน่ง</label>
                <input
                  v-model="newRole"
                  type="text"
                  required
                  placeholder="เช่น ผู้เชี่ยวชาญต้นทุนบุฟเฟต์"
                  class="w-full rounded-xl bg-neutral-100 px-3 py-2 text-xs text-ink placeholder:text-muted focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-ink mb-1">หมวดหมู่</label>
                <select
                  v-model="newCategory"
                  class="w-full rounded-xl bg-neutral-100 px-3 py-2 text-xs text-ink focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="finance">การเงิน & ต้นทุน</option>
                  <option value="market">ตลาด & เศรษฐกิจ</option>
                  <option value="strategy">กลยุทธ์ราคา</option>
                  <option value="operations">บริหาร & ความเสี่ยง</option>
                  <option value="marketing">การตลาดโซเชียล</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-ink mb-1">บุคลิกและสไตล์การตอบ</label>
              <div class="grid grid-cols-2 gap-2">
                <label
                  v-for="p in personalities"
                  :key="p.id"
                  :class="[
                    'cursor-pointer rounded-xl p-2.5 text-left border transition',
                    newPersonality === p.id
                      ? 'border-black bg-black/5 text-ink'
                      : 'border-black/[0.06] bg-white text-muted hover:border-black/20',
                  ]"
                >
                  <input
                    v-model="newPersonality"
                    type="radio"
                    name="personality"
                    :value="p.id"
                    class="sr-only"
                  />
                  <p class="text-xs font-bold leading-tight">{{ p.label }}</p>
                  <p class="text-[10.5px] mt-0.5 leading-snug">{{ p.desc }}</p>
                </label>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-ink mb-1">คำอธิบายสั้นๆ</label>
              <input
                v-model="newDescription"
                type="text"
                placeholder="เช่น คอยจี้ต้นทุนของสด คำนวณกำไรต่อหัว และจับตาของเสียในถาด"
                class="w-full rounded-xl bg-neutral-100 px-3 py-2 text-xs text-ink placeholder:text-muted focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-ink mb-1">
                คำสั่งเฉพาะ / นิสัยการวิเคราะห์ (System Prompt)
              </label>
              <textarea
                v-model="newPrompt"
                rows="3"
                placeholder="เช่น คุณคือผู้เชี่ยวชาญร้านบุฟเฟต์ คอยเตือนเรื่อง Food Cost อย่าให้เกิน 38% ทุกครั้งที่วิเคราะห์ให้ชี้จุดรั่วไหลและบอกแนวทางคุมสต็อกเสมอ..."
                class="w-full rounded-xl bg-neutral-100 px-3 py-2 text-xs text-ink placeholder:text-muted focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-ink mb-1">ป้ายความเชี่ยวชาญ (คั่นด้วยเครื่องหมายจุลภาค)</label>
              <input
                v-model="newTags"
                type="text"
                placeholder="เช่น บุฟเฟต์, คุมสต็อก, Food Cost"
                class="w-full rounded-xl bg-neutral-100 px-3 py-2 text-xs text-ink placeholder:text-muted focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <!-- Optional Custom Logic Override -->
            <div class="rounded-xl border border-black/[0.06] bg-neutral-50/70 p-3 space-y-2">
              <p class="text-[11px] font-bold text-ink">กำหนด Logic ความเชี่ยวชาญเพิ่มเติม (ไม่บังคับ):</p>
              <div>
                <label class="block text-[10.5px] font-medium text-muted mb-0.5">Framework หรือสูตรการคิด</label>
                <input
                  v-model="customFramework"
                  type="text"
                  placeholder="เว้นว่างเพื่อให้ระบบสร้างให้ตามหมวดหมู่ หรือกรอกเช่น FIFO Batch Variance Modeling"
                  class="w-full rounded-lg bg-white px-2.5 py-1.5 text-xs text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label class="block text-[10.5px] font-medium text-muted mb-0.5">เหตุผลที่เก่งในด้านนี้ (Why Specialized)</label>
                <input
                  v-model="customWhySpecialized"
                  type="text"
                  placeholder="เว้นว่างเพื่อให้ระบบสังเคราะห์ให้อัตโนมัติ"
                  class="w-full rounded-lg bg-white px-2.5 py-1.5 text-xs text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-2">
              <AppButton variant="secondary" size="sm" type="button" @click="currentTab = 'my-team'">
                ยกเลิก
              </AppButton>
              <AppButton size="sm" type="submit">
                บันทึกและเปิดใช้งานทันที
              </AppButton>
            </div>
          </form>
        </div>
      </div>
    </template>
  </AppModal>
</template>
