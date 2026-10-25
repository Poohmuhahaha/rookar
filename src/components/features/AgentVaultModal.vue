<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  Check,
  Plus,
  Search,
  Trash2,
  Users,
  Lock,
  Globe,
  CheckSquare,
  Square,
  ArrowLeft,
  Brain,
  Award,
  Database,
  Target,
  FileText,
  ChevronDown,
  ChevronUp,
  Edit3,
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
  updateAgent,
} from '@/lib/agentVault'
import type { AgentCategory, AgentPersonality, AgentProfile } from '@/types'

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
  { id: 'finance', label: 'การเงิน' },
  { id: 'market', label: 'ตลาด' },
  { id: 'strategy', label: 'กลยุทธ์' },
  { id: 'operations', label: 'จัดการ' },
  { id: 'marketing', label: 'โซเชียล' },
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

// Create & Customize agent form
const editingCustomAgentId = ref<string | null>(null)
const newName = ref('')
const newRole = ref('')
const newCategory = ref<AgentCategory>('finance')
const newPersonality = ref<AgentPersonality>('analytical')
const newDescription = ref('')
const newPrompt = ref('')
const newTags = ref('')

function startCreateNew() {
  editingCustomAgentId.value = null
  newName.value = ''
  newRole.value = ''
  newDescription.value = ''
  newPrompt.value = ''
  newTags.value = ''
  currentTab.value = 'create'
}

function startCustomizeAgent(agent: AgentProfile) {
  newName.value = agent.isCustom
    ? agent.name
    : `${agent.name.replace(/\s*\(.*\)/, '').trim()} (ฉบับร้านฉัน)`
  newRole.value = agent.role
  newCategory.value = agent.category
  newPersonality.value = agent.personality
  newDescription.value = agent.description
  newPrompt.value = agent.systemPrompt
  newTags.value = (agent.specialtyTags || []).join(', ')

  if (agent.isCustom) {
    editingCustomAgentId.value = agent.id
  } else {
    editingCustomAgentId.value = null
  }

  inspectingAgent.value = null
  editingAgent.value = null
  currentTab.value = 'create'
}

function cancelCustomize() {
  editingCustomAgentId.value = null
  newName.value = ''
  newRole.value = ''
  newDescription.value = ''
  newPrompt.value = ''
  newTags.value = ''
  currentTab.value = 'my-team'
}

const personalities: { id: AgentPersonality; label: string }[] = [
  { id: 'analytical', label: 'วิเคราะห์ลึก' },
  { id: 'roast', label: 'ขวานผ่าซาก 🔥' },
  { id: 'professional', label: 'สุภาพทางการ' },
  { id: 'creative', label: 'ครีเอทีฟ' },
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
    color: '#111827',
    specialtyTags: tags.length ? tags : ['เฉพาะทาง'],
    enabled: true,
    chatScope: 'all' as const,
    allowedChatIds: [],
  }

  const generatedLogic = generateCustomExpertiseLogic(partialAgent)

  if (editingCustomAgentId.value) {
    updateAgent(editingCustomAgentId.value, {
      ...partialAgent,
      expertiseLogic: generatedLogic,
    })
  } else {
    createCustomAgent({
      ...partialAgent,
      expertiseLogic: generatedLogic,
    })
  }

  cancelCustomize()
}
</script>

<template>
  <AppModal
    :open="open"
    title="Agent Vault"
    size="lg"
    @update:open="emit('update:open', $event)"
  >
    <template #default>
      <!-- 1. LOGIC INSPECTOR SUBVIEW (MINIMAL) -->
      <div v-if="inspectingAgent" class="space-y-4">
        <div class="flex items-center justify-between border-b border-black/[0.06] pb-3">
          <button
            type="button"
            class="flex items-center gap-1.5 text-xs text-muted hover:text-ink transition"
            @click="closeLogicInspector"
          >
            <ArrowLeft class="h-3.5 w-3.5" />
            กลับ
          </button>
          <div class="flex items-center gap-2">
            <span
              class="h-2 w-2 rounded-full"
              :style="{ backgroundColor: inspectingAgent.color }"
            />
            <span class="text-xs font-semibold text-ink">{{ inspectingAgent.name }}</span>
          </div>
        </div>

        <!-- Identity -->
        <div class="flex items-center justify-between rounded-xl bg-neutral-50 px-3.5 py-3 border border-black/[0.04]">
          <div>
            <div class="flex items-center gap-2">
              <h4 class="text-xs font-bold text-ink">{{ inspectingAgent.name }}</h4>
              <span class="text-[10px] text-muted">· {{ inspectingAgent.creator.name }}</span>
            </div>
            <p class="text-[11px] text-muted mt-0.5">{{ inspectingAgent.role }}</p>
          </div>

          <button
            type="button"
            :class="[
              'rounded-full px-3 py-1 text-xs font-medium transition',
              inspectingAgent.enabled
                ? 'bg-black text-white hover:bg-neutral-800'
                : 'bg-neutral-200 text-ink hover:bg-black hover:text-white',
            ]"
            @click="toggleAgentEnabled(inspectingAgent.id)"
          >
            {{ inspectingAgent.enabled ? 'เปิดใช้งาน' : '+ เพิ่มเข้าทีม' }}
          </button>
        </div>

        <!-- Core Competency -->
        <div class="space-y-1">
          <p class="text-[11px] font-semibold text-muted uppercase tracking-wider">เหตุผลความเชี่ยวชาญ</p>
          <p class="text-xs text-ink leading-relaxed font-normal">
            {{ inspectingAgent.expertiseLogic?.whySpecialized }}
          </p>
        </div>

        <!-- Framework & Benchmark (Clean 2-Col) -->
        <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div class="rounded-xl border border-black/[0.06] p-3">
            <div class="flex items-center gap-1.5 text-[11px] font-semibold text-muted mb-1">
              <Brain class="h-3.5 w-3.5 text-ink" />
              <span>Framework การคิด</span>
            </div>
            <p class="text-xs font-medium text-ink leading-snug">
              {{ inspectingAgent.expertiseLogic?.reasoningFramework }}
            </p>
          </div>

          <div class="rounded-xl border border-black/[0.06] p-3">
            <div class="flex items-center gap-1.5 text-[11px] font-semibold text-muted mb-1">
              <Award class="h-3.5 w-3.5 text-ink" />
              <span>ดัชนีชี้วัด (Benchmark)</span>
            </div>
            <div class="flex items-baseline gap-1.5">
              <span class="text-base font-bold text-ink">
                {{ inspectingAgent.expertiseLogic?.benchmarkScore.score }}
              </span>
              <span class="text-[11px] text-muted">
                {{ inspectingAgent.expertiseLogic?.benchmarkScore.label }}
              </span>
            </div>
            <p class="text-[10.5px] text-muted mt-0.5 leading-snug">
              {{ inspectingAgent.expertiseLogic?.benchmarkScore.metric }}
            </p>
          </div>
        </div>

        <!-- Knowledge Base -->
        <div class="space-y-1.5">
          <p class="text-[11px] font-semibold text-muted uppercase tracking-wider">คลังข้อมูลอ้างอิง</p>
          <div class="space-y-1">
            <div
              v-for="(kb, idx) in inspectingAgent.expertiseLogic?.knowledgeBase || []"
              :key="idx"
              class="flex items-center gap-2 text-xs text-ink"
            >
              <div class="h-1 w-1 rounded-full bg-neutral-400" />
              <span class="text-[11.5px] text-neutral-700">{{ kb }}</span>
            </div>
          </div>
        </div>

        <!-- System Prompt Toggle (Minimal Collapsible) -->
        <div class="border-t border-black/[0.06] pt-2">
          <button
            type="button"
            class="flex items-center gap-1.5 text-[11px] text-muted hover:text-ink transition"
            @click="showSystemPrompt = !showSystemPrompt"
          >
            <component :is="showSystemPrompt ? ChevronUp : ChevronDown" class="h-3 w-3" />
            <span>{{ showSystemPrompt ? 'ซ่อน System Prompt' : 'ดู System Prompt' }}</span>
          </button>
          <div v-if="showSystemPrompt" class="mt-2 rounded-lg bg-neutral-50 p-2.5 text-[11px] font-mono text-neutral-600 leading-relaxed border border-black/[0.04]">
            {{ inspectingAgent.systemPrompt }}
          </div>
        </div>

        <!-- Inspector Footer -->
        <div class="flex items-center justify-between pt-3 border-t border-black/[0.06]">
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="text-xs text-muted hover:text-ink transition"
              @click="openPermissionEditor(inspectingAgent)"
            >
              สิทธิ์แชท
            </button>
            <button
              type="button"
              class="text-xs text-muted hover:text-ink transition"
              @click="startCustomizeAgent(inspectingAgent)"
            >
              {{ inspectingAgent.isCustom ? 'แก้ไข' : 'ปรับแต่งฉบับร้านฉัน' }}
            </button>
          </div>

          <AppButton size="sm" variant="secondary" @click="closeLogicInspector">
            ปิด
          </AppButton>
        </div>
      </div>

      <!-- 2. PERMISSION EDITOR SUBVIEW (MINIMAL) -->
      <div v-else-if="editingAgent" class="space-y-4">
        <div class="flex items-center justify-between border-b border-black/[0.06] pb-3">
          <button
            type="button"
            class="flex items-center gap-1.5 text-xs text-muted hover:text-ink transition"
            @click="closePermissionEditor"
          >
            <ArrowLeft class="h-3.5 w-3.5" />
            กลับ
          </button>
          <span class="text-xs font-semibold text-ink">สิทธิ์ห้องแชท: {{ editingAgent.name }}</span>
        </div>

        <!-- Clean Scope Selector -->
        <div class="space-y-2">
          <label
            :class="[
              'flex items-center justify-between rounded-xl p-3 border transition cursor-pointer text-xs',
              tempScope === 'all'
                ? 'bg-neutral-50 border-black/30 font-semibold text-ink'
                : 'bg-white border-black/[0.06] text-muted hover:border-black/20',
            ]"
          >
            <div class="flex items-center gap-2">
              <input v-model="tempScope" type="radio" value="all" />
              <span>ทุกห้องแชท (All Chats)</span>
            </div>
            <span class="text-[11px] text-muted font-normal">พร้อมช่วยในทุกห้อง</span>
          </label>

          <label
            :class="[
              'flex items-center justify-between rounded-xl p-3 border transition cursor-pointer text-xs',
              tempScope === 'specific'
                ? 'bg-neutral-50 border-black/30 font-semibold text-ink'
                : 'bg-white border-black/[0.06] text-muted hover:border-black/20',
            ]"
          >
            <div class="flex items-center gap-2">
              <input v-model="tempScope" type="radio" value="specific" />
              <span>จำกัดเฉพาะห้องที่เลือก</span>
            </div>
            <span v-if="tempScope === 'specific'" class="text-[11px] text-ink font-semibold">
              เลือกไว้ {{ tempAllowedChats.length }} ห้อง
            </span>
          </label>
        </div>

        <!-- Chat Checklist -->
        <div v-if="tempScope === 'specific'" class="space-y-2 pt-1">
          <div class="flex items-center justify-between text-[11px] text-muted px-1">
            <span>เลือกห้องแชท:</span>
            <div class="flex items-center gap-2">
              <button type="button" class="text-ink hover:underline" @click="selectAllChats">ทั้งหมด</button>
              <span>·</span>
              <button type="button" class="hover:underline" @click="clearAllChats">ล้าง</button>
            </div>
          </div>

          <div v-if="conversations.length === 0" class="rounded-xl bg-neutral-50 p-4 text-center text-xs text-muted">
            ยังไม่มีประวัติการสนทนา
          </div>

          <div v-else class="max-h-52 overflow-y-auto rounded-xl border border-black/[0.06] divide-y divide-black/[0.04] bg-white">
            <div
              v-for="chat in conversations"
              :key="chat.id"
              class="flex items-center justify-between p-2.5 text-xs transition cursor-pointer hover:bg-neutral-50"
              @click="toggleChatPermission(chat.id)"
            >
              <div class="flex items-center gap-2 min-w-0 pr-2">
                <component
                  :is="tempAllowedChats.includes(chat.id) ? CheckSquare : Square"
                  class="h-3.5 w-3.5 shrink-0 text-ink"
                />
                <span class="truncate text-ink font-medium">{{ chat.title }}</span>
              </div>
              <span class="text-[10px] text-muted shrink-0">
                {{ tempAllowedChats.includes(chat.id) ? 'อนุญาต' : 'ปิด' }}
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-black/[0.06]">
          <AppButton variant="secondary" size="sm" @click="closePermissionEditor">
            ยกเลิก
          </AppButton>
          <AppButton size="sm" @click="savePermissions">
            บันทึกสิทธิ์
          </AppButton>
        </div>
      </div>

      <!-- 3. MAIN TABS VIEW (MINIMAL) -->
      <div v-else class="space-y-4">
        <!-- Minimal Segmented Tab Control -->
        <div class="flex items-center justify-between border-b border-black/[0.06] pb-3">
          <div class="inline-flex rounded-full bg-neutral-100 p-0.5">
            <button
              type="button"
              :class="[
                'rounded-full px-3 py-1 text-xs font-medium transition',
                currentTab === 'my-team' ? 'bg-white text-ink shadow-xs' : 'text-muted hover:text-ink',
              ]"
              @click="currentTab = 'my-team'"
            >
              ทีมของฉัน ({{ activeAgents.length }})
            </button>
            <button
              type="button"
              :class="[
                'rounded-full px-3 py-1 text-xs font-medium transition',
                currentTab === 'vault' ? 'bg-white text-ink shadow-xs' : 'text-muted hover:text-ink',
              ]"
              @click="currentTab = 'vault'"
            >
              คลังทั้งหมด ({{ agentsList.length }})
            </button>
          </div>

          <button
            type="button"
            :class="[
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition',
              currentTab === 'create' ? 'bg-black text-white' : 'text-muted hover:text-ink hover:bg-neutral-100',
            ]"
            @click="currentTab === 'create' ? cancelCustomize() : startCreateNew()"
          >
            <Plus class="h-3 w-3" />
            <span>สร้าง Agent</span>
          </button>
        </div>

        <!-- TAB 1: MY TEAM (MINIMAL CARDS) -->
        <div v-if="currentTab === 'my-team'" class="space-y-2">
          <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div
              v-for="agent in agentsList"
              :key="agent.id"
              :class="[
                'flex flex-col justify-between rounded-xl p-3.5 border transition',
                agent.enabled
                  ? 'bg-white border-black/10'
                  : 'bg-neutral-50/60 border-black/[0.04] opacity-50',
              ]"
            >
              <div>
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5">
                      <span
                        class="h-2 w-2 rounded-full shrink-0"
                        :style="{ backgroundColor: agent.color }"
                      />
                      <h4 class="text-xs font-bold text-ink truncate">{{ agent.name }}</h4>
                    </div>
                    <p class="text-[11px] text-muted truncate mt-0.5">{{ agent.role }}</p>
                  </div>

                  <!-- Minimal Toggle Switch -->
                  <button
                    type="button"
                    :class="[
                      'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out',
                      agent.enabled ? 'bg-black' : 'bg-neutral-200',
                    ]"
                    :aria-checked="agent.enabled"
                    role="switch"
                    @click="toggleAgentEnabled(agent.id)"
                  >
                    <span
                      :class="[
                        'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out mt-0.5',
                        agent.enabled ? 'translate-x-4 ml-0.5' : 'translate-x-0.5',
                      ]"
                    />
                  </button>
                </div>

                <p class="mt-2 text-[11.5px] leading-relaxed text-muted line-clamp-2">
                  {{ agent.description }}
                </p>
              </div>

              <!-- Minimal Card Actions -->
              <div class="mt-3 pt-2 border-t border-black/[0.04] flex items-center justify-between text-[11px]">
                <span class="text-muted text-[10.5px]">
                  {{ agent.chatScope === 'specific' ? `จำกัด ${agent.allowedChatIds?.length || 0} แชท` : 'ทุกแชท' }}
                </span>

                <div class="flex items-center gap-2.5">
                  <button
                    type="button"
                    class="text-muted hover:text-ink transition"
                    @click="openLogicInspector(agent)"
                  >
                    ตรรกะ
                  </button>
                  <button
                    type="button"
                    class="text-muted hover:text-ink transition"
                    @click="openPermissionEditor(agent)"
                  >
                    สิทธิ์
                  </button>
                  <button
                    type="button"
                    class="text-muted hover:text-ink transition"
                    @click="startCustomizeAgent(agent)"
                  >
                    ปรับแต่ง
                  </button>
                  <button
                    v-if="agent.isCustom"
                    type="button"
                    class="text-neutral-400 hover:text-red-600 transition"
                    @click="deleteCustomAgent(agent.id)"
                  >
                    <Trash2 class="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 2: VAULT DIRECTORY (MINIMAL) -->
        <div v-else-if="currentTab === 'vault'" class="space-y-3">
          <!-- Search & Filter -->
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div class="relative flex-1">
              <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="ค้นหา Agent..."
                class="w-full rounded-lg bg-neutral-50 pl-8 pr-3 py-1.5 text-xs text-ink placeholder:text-muted focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div class="flex items-center gap-1 overflow-x-auto no-scrollbar">
              <button
                v-for="cat in categories"
                :key="cat.id"
                type="button"
                :class="[
                  'whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-medium transition',
                  selectedCategory === cat.id
                    ? 'bg-black text-white'
                    : 'text-muted hover:text-ink',
                ]"
                @click="selectedCategory = cat.id"
              >
                {{ cat.label }}
              </button>
            </div>
          </div>

          <!-- Cards -->
          <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div
              v-for="agent in filteredVaultAgents"
              :key="agent.id"
              class="flex flex-col justify-between rounded-xl bg-white p-3.5 border border-black/[0.06] hover:border-black/20 transition"
            >
              <div>
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5">
                      <span
                        class="h-2 w-2 rounded-full shrink-0"
                        :style="{ backgroundColor: agent.color }"
                      />
                      <h4 class="text-xs font-bold text-ink truncate">{{ agent.name }}</h4>
                    </div>
                    <p class="text-[11px] text-muted truncate mt-0.5">{{ agent.role }}</p>
                  </div>
                  <span class="text-[10px] text-muted shrink-0">{{ agent.creator.name }}</span>
                </div>

                <p class="mt-2 text-[11.5px] leading-relaxed text-muted line-clamp-2">
                  {{ agent.description }}
                </p>
              </div>

              <div class="mt-3 pt-2 border-t border-black/[0.04] flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  class="text-muted hover:text-ink transition"
                  @click="openLogicInspector(agent)"
                >
                  ดูตรรกะ
                </button>

                <button
                  type="button"
                  :class="[
                    'rounded-full px-2.5 py-0.5 text-[11px] font-medium transition',
                    agent.enabled
                      ? 'bg-neutral-100 text-ink hover:bg-neutral-200'
                      : 'bg-black text-white hover:bg-neutral-800',
                  ]"
                  @click="toggleAgentEnabled(agent.id)"
                >
                  {{ agent.enabled ? 'อยู่ในทีมแล้ว' : '+ เพิ่มเข้าทีม' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 3: CREATE / CUSTOMIZE FORM (ULTRA CLEAN & MINIMAL) -->
        <div v-else class="space-y-3.5 max-w-lg mx-auto py-1">
          <div class="flex items-center justify-between border-b border-black/[0.06] pb-2">
            <span class="text-xs font-bold text-ink">
              {{ editingCustomAgentId ? 'แก้ไขข้อมูล Agent' : 'สร้าง Agent ใหม่' }}
            </span>
            <button
              type="button"
              class="text-xs text-muted hover:text-ink transition"
              @click="cancelCustomize"
            >
              ยกเลิก
            </button>
          </div>

          <form class="space-y-3" @submit.prevent="handleCreateAgent">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label class="block text-[11px] font-medium text-muted mb-1">ชื่อ Agent</label>
                <input
                  v-model="newName"
                  type="text"
                  required
                  placeholder="เช่น พี่ต่อ คุมต้นทุน"
                  class="w-full rounded-lg bg-neutral-50 px-2.5 py-1.5 text-xs text-ink placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label class="block text-[11px] font-medium text-muted mb-1">ตำแหน่ง / ความเชี่ยวชาญ</label>
                <input
                  v-model="newRole"
                  type="text"
                  required
                  placeholder="เช่น ผู้จัดการต้นทุนร้านอาหาร"
                  class="w-full rounded-lg bg-neutral-50 px-2.5 py-1.5 text-xs text-ink placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label class="block text-[11px] font-medium text-muted mb-1">หมวดหมู่</label>
                <select
                  v-model="newCategory"
                  class="w-full rounded-lg bg-neutral-50 px-2.5 py-1.5 text-xs text-ink focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="finance">การเงิน & ต้นทุน</option>
                  <option value="market">ตลาด & เศรษฐกิจ</option>
                  <option value="strategy">กลยุทธ์ราคา</option>
                  <option value="operations">บริหารจัดการ</option>
                  <option value="marketing">การตลาดโซเชียล</option>
                </select>
              </div>

              <div>
                <label class="block text-[11px] font-medium text-muted mb-1">สไตล์การตอบ</label>
                <div class="grid grid-cols-2 gap-1">
                  <button
                    v-for="p in personalities"
                    :key="p.id"
                    type="button"
                    :class="[
                      'rounded-md py-1 text-[11px] font-medium transition text-center border',
                      newPersonality === p.id
                        ? 'bg-black text-white border-black'
                        : 'bg-neutral-50 text-muted border-transparent hover:text-ink',
                    ]"
                    @click="newPersonality = p.id"
                  >
                    {{ p.label }}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-medium text-muted mb-1">คำอธิบายย่อ</label>
              <input
                v-model="newDescription"
                type="text"
                placeholder="สรุปหน้าที่และการวิเคราะห์สั้นๆ"
                class="w-full rounded-lg bg-neutral-50 px-2.5 py-1.5 text-xs text-ink placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label class="block text-[11px] font-medium text-muted mb-1">
                คำสั่ง Prompt กำกับพฤติกรรม
              </label>
              <textarea
                v-model="newPrompt"
                rows="3"
                placeholder="ระบุแนวทางการตอบ เช่น ให้ตรวจสอบ Food Cost อย่าให้เกิน 35% และเตือนเรื่องสต็อกของสด..."
                class="w-full rounded-lg bg-neutral-50 px-2.5 py-1.5 text-xs text-ink placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-black resize-none"
              />
            </div>

            <div>
              <label class="block text-[11px] font-medium text-muted mb-1">ป้ายกำกับ (คั่นด้วยจุลภาค)</label>
              <input
                v-model="newTags"
                type="text"
                placeholder="เช่น คุมสต็อก, ชาบู, Food Cost"
                class="w-full rounded-lg bg-neutral-50 px-2.5 py-1.5 text-xs text-ink placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div class="flex items-center justify-end gap-2 pt-2">
              <AppButton variant="secondary" size="sm" type="button" @click="cancelCustomize">
                ยกเลิก
              </AppButton>
              <AppButton size="sm" type="submit">
                {{ editingCustomAgentId ? 'บันทึก' : 'สร้าง' }}
              </AppButton>
            </div>
          </form>
        </div>
      </div>
    </template>
  </AppModal>
</template>
