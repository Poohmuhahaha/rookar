<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter, useSearch } from '@tanstack/vue-router'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  ArrowUp,
  Check,
  CircleStop,
  Database,
  FileSpreadsheet,
  History,
  Info,
  MessageSquare,
  Mic,
  PanelRightOpen,
  Paperclip,
  Rocket,
  Settings as SettingsIcon,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
  X,
  Users,
  Plus,
  Lightbulb,
} from '@lucide/vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppSheet from '@/components/ui/AppSheet.vue'
import ChatBubble from '@/components/features/ChatBubble.vue'
import ChatHistory from '@/components/features/ChatHistory.vue'
import WelcomeMark from '@/components/brand/WelcomeMark.vue'
import AgentVaultModal from '@/components/features/AgentVaultModal.vue'
import { agentsList, isAgentAllowedInChat } from '@/lib/agentVault'
import { getIndustryProfile } from '@/lib/industries'
import { industryFocus } from '@/lib/industryFocus'
import { createConversation, createMessage, getConversations, getSession, listSources, saveConversations, streamAiReply } from '@/lib/mockApi'
import { formatNumber, timeAgo } from '@/lib/format'
import { useToast } from '@/lib/toast'
import type { ChatMessage, Conversation, SpecialistType } from '@/types'

const router = useRouter()
const routeSearch = useSearch({ from: '/app/assistant' })
const queryClient = useQueryClient()
const toast = useToast()
const session = getSession()
const industryProfile = getIndustryProfile(industryFocus.value)

const { data: conversationData, isPending: historyPending } = useQuery({
  queryKey: ['conversations'],
  queryFn: getConversations,
})

const { data: sources } = useQuery({
  queryKey: ['sources'],
  queryFn: listSources,
})

const history = ref<Conversation[]>([])
const activeId = ref<string | null>(null)
const messages = ref<ChatMessage[]>([])
const composer = ref('')
const attachedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const isStreaming = ref(false)
const isListening = ref(false)
const stopRequested = ref(false)
let streamController: AbortController | null = null
const contextOpen = ref(false)
const historyOpen = ref(false)
const showAgentVault = ref(false)
const inspectAgentId = ref<string | null>(null)

function openAgentLogic(agentId: string) {
  inspectAgentId.value = agentId
  showAgentVault.value = true
}

function openVaultGeneral() {
  inspectAgentId.value = null
  showAgentVault.value = true
}

const activeAgents = computed(() => agentsList.value.filter((a) => a.enabled))
const activeBoardroomAgents = computed(() => {
  return agentsList.value.filter((agent) => isAgentAllowedInChat(agent, activeId.value))
})
const historyCollapsed = ref(localStorage.getItem('rookar.assistant.history-collapsed') === '1')
const historyPanelWidth = ref(332)

function updateHistoryPanelWidth() {
  if (typeof window === 'undefined') return
  historyPanelWidth.value = window.innerWidth >= 1920 ? 520 : window.innerWidth >= 1440 ? 420 : 332
}

onMounted(() => {
  updateHistoryPanelWidth()
  window.addEventListener('resize', updateHistoryPanelWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateHistoryPanelWidth)
})
const initialized = ref(false)
const messageList = ref<HTMLElement | null>(null)
const composerEl = ref<HTMLTextAreaElement | null>(null)
let scrollFrame: number | null = null

const firstName = computed(() => session?.user.name.split(' ')[0] ?? 'คุณ')
const totalRows = computed(() => (sources.value ?? []).reduce((sum, source) => sum + source.rowCount, 0))

type SpecialistRole = 'all' | 'finance' | 'market' | 'strategy' | 'planning'

const activeSpecialist = ref<SpecialistRole | null>(null)
const roleModalOpen = ref(false)
const chatPickerOpen = ref(false)
let ignoreNextChatReset = false

const specialistRoles = [
  { id: 'all' as const, label: 'ภาพรวม (All)', icon: Sparkles, desc: 'มองภาพรวมธุรกิจและเชื่อมโยงทุกมิติ' },
  { id: 'finance' as const, label: 'การเงิน & ต้นทุน', icon: Wallet, desc: 'เจาะลึกต้นทุนหลัก ค่าแรง และสภาพคล่อง' },
  { id: 'market' as const, label: 'ตลาด & GDP', icon: TrendingUp, desc: 'วิเคราะห์ GDP เงินเฟ้อ และกำลังซื้อ' },
  { id: 'strategy' as const, label: 'กลยุทธ์ & ราคา', icon: Target, desc: 'ตั้งราคา แข่งขันในตลาด และรักษา Margin' },
  { id: 'planning' as const, label: 'แผนธุรกิจ (Planning)', icon: Rocket, desc: 'จัดทำ Action Plan ปฏิบัติการ 30 วัน' },
]

function roleFromConversation(role?: SpecialistType): SpecialistRole {
  return role === 'finance' || role === 'market' || role === 'strategy' || role === 'planning' ? role : 'all'
}

function roleForConversation(role: SpecialistRole | null): SpecialistType {
  return role && role !== 'all' ? role : 'general'
}

function roleLabel(role?: SpecialistType) {
  return specialistRoles.find((item) => item.id === roleFromConversation(role))?.label ?? 'ภาพรวม (All)'
}

function selectSpecialist(role: SpecialistRole) {
  activeSpecialist.value = role
  roleModalOpen.value = false
  nextTick(() => composerEl.value?.focus())
}

function startWithPrompt(prompt: string) {
  startNewChat(false)
  activeSpecialist.value = 'all'
  void send(prompt)
}

const quickPrompts = computed(() => {
  if (!activeSpecialist.value) return []
  const profile = industryProfile
  if (activeSpecialist.value === 'finance') {
    return [
      `ต้นทุนหลักของ${profile.shortLabel}`,
      'คำนวณจุดคุ้มทุน',
      profile.sample.costLabels.labor,
      'บริหารกระแสเงินสด',
    ]
  }
  if (activeSpecialist.value === 'market') {
    return [
      `ภาพรวมตลาด ${profile.shortLabel}`,
      'วิเคราะห์เทียบ GDP',
      'เงินเฟ้อกระทบอย่างไร',
      'แนวโน้มกำลังซื้อ',
    ]
  }
  if (activeSpecialist.value === 'strategy') {
    return [
      'กลยุทธ์ตั้งราคา',
      `เพิ่มรายได้จาก${profile.shortLabel}`,
      `ลด${profile.sample.costLabels.materials}`,
      'รักษาลูกค้าประจำ',
    ]
  }
  if (activeSpecialist.value === 'planning') {
    return [
      'สรุป Action Plan 30 วัน',
      'วางเป้าหมาย KPI',
      `แผนควบคุม${profile.sample.costLabels.materials}`,
      'ขั้นตอนเตรียมรับไฮซีซั่น',
    ]
  }
  return profile.sample.quickPrompts
})

watch(
  conversationData,
  (data) => {
    if (!data || initialized.value) return
    initialized.value = true
    history.value = data.map((conversation) => ({
      ...conversation,
      messages: conversation.messages.map((message) => ({
        ...message,
        citations: message.citations?.map((citation) => ({ ...citation })),
      })),
    }))

    const pendingPrompt = routeSearch.value.prompt
    const pendingChat = routeSearch.value.chat
    if (pendingPrompt) {
      startWithPrompt(pendingPrompt)
    } else if (pendingChat && pendingChat !== 'new') {
      const conversation = history.value.find((item) => item.id === pendingChat)
      if (conversation) selectConversation(conversation)
      else openChatPicker()
    } else if (pendingChat === 'new') {
      startNewChat()
    } else {
      openChatPicker()
    }
  },
  { immediate: true },
)

watch(
  () => routeSearch.value.prompt,
  (prompt, previous) => {
    if (!initialized.value || !prompt || prompt === previous) return
    startWithPrompt(prompt)
  },
)

watch(
  () => routeSearch.value.chat,
  (chat, previous) => {
    if (!initialized.value || chat === previous) return
    if (chat === 'new') {
      if (ignoreNextChatReset) {
        ignoreNextChatReset = false
        return
      }
      startNewChat()
      return
    }
    if (!chat) {
      if (ignoreNextChatReset) {
        ignoreNextChatReset = false
        return
      }
      openChatPicker()
      return
    }
    if (chat === activeId.value) return
    const conversation = history.value.find((item) => item.id === chat)
    if (conversation) selectConversation(conversation)
  },
)

watch(
  () => routeSearch.value.context,
  (context) => {
    if (context !== '1') return
    contextOpen.value = true
    void router.navigate({
      to: '/app/assistant',
      search: { ...routeSearch.value, context: undefined },
      replace: true,
    })
  },
)

watch(
  () => routeSearch.value.history,
  (history) => {
    if (history !== '1') return
    historyCollapsed.value = false
    if (!window.matchMedia('(min-width: 1280px)').matches) historyOpen.value = true
    void router.navigate({
      to: '/app/assistant',
      search: { ...routeSearch.value, history: undefined },
      replace: true,
    })
  },
)

watch(historyCollapsed, (value) => {
  localStorage.setItem('rookar.assistant.history-collapsed', value ? '1' : '0')
})

watch(composer, () => {
  nextTick(() => {
    const element = composerEl.value
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, 132)}px`
  })
})

function scrollToBottom() {
  const element = messageList.value
  if (!element) return
  element.scrollTop = element.scrollHeight
}

function queueScroll() {
  if (scrollFrame !== null) return
  scrollFrame = window.requestAnimationFrame(() => {
    scrollToBottom()
    scrollFrame = null
  })
}

function cloneMessages(items: ChatMessage[]) {
  return items.map((message) => ({
    ...message,
    citations: message.citations?.map((citation) => ({ ...citation })),
  }))
}

function selectConversation(conversation: Conversation) {
  if (isStreaming.value) {
    toast.info('กำลังสร้างคำตอบ', 'กดหยุดคำตอบก่อนเปลี่ยนบทสนทนา')
    return
  }
  activeId.value = conversation.id
  activeSpecialist.value = roleFromConversation(conversation.specialistRole)
  roleModalOpen.value = false
  chatPickerOpen.value = false
  messages.value = cloneMessages(conversation.messages)
  nextTick(scrollToBottom)
}

function resetChatView() {
  activeId.value = null
  activeSpecialist.value = null
  messages.value = []
  composer.value = ''
  contextOpen.value = false
}

function startNewChat(openRoleModal = true) {
  if (isStreaming.value) {
    toast.info('กำลังสร้างคำตอบ', 'กดหยุดคำตอบก่อนเริ่มแชทใหม่')
    return
  }
  resetChatView()
  roleModalOpen.value = openRoleModal
  chatPickerOpen.value = false
}

function openChatPicker() {
  if (isStreaming.value) {
    toast.info('กำลังสร้างคำตอบ', 'กดหยุดคำตอบก่อนเปลี่ยนบทสนทนา')
    return
  }
  resetChatView()
  roleModalOpen.value = false
  chatPickerOpen.value = true
}

function startNewChatFromPicker() {
  chatPickerOpen.value = false
  ignoreNextChatReset = true
  startNewChat()
  void router.navigate({ to: '/app/assistant', search: { chat: 'new' }, replace: true })
}

function chooseConversationFromPicker(conversation: Conversation) {
  chatPickerOpen.value = false
  chooseConversation(conversation)
}

function syncConversation(conversationId: string) {
  const conversation = history.value.find((item) => item.id === conversationId)
  if (!conversation) return
  conversation.messages = cloneMessages(messages.value)
  conversation.specialistRole = roleForConversation(activeSpecialist.value)
  const lastAnswer = [...messages.value]
    .reverse()
    .find((message) => message.role === 'assistant' && message.content.trim())
  if (lastAnswer) {
    conversation.preview = lastAnswer.content.replace(/\s+/g, ' ').slice(0, 120)
  }
  conversation.updatedAt = new Date().toISOString()
  saveConversations(history.value)
  void queryClient.invalidateQueries({ queryKey: ['conversations'] })
}

function pickFile() {
  if (isStreaming.value) return
  fileInput.value?.click()
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!file.name.toLowerCase().endsWith('.csv')) {
    toast.error('ไฟล์ไม่รองรับ', 'สำหรับการแชท รองรับไฟล์ CSV เท่านั้น')
    input.value = ''
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    toast.error('ไฟล์ใหญ่เกินไป', 'รองรับไฟล์ไม่เกิน 10 MB')
    input.value = ''
    return
  }

  attachedFile.value = file
  input.value = ''
}

function removeAttachment() {
  attachedFile.value = null
}

async function send(rawQuestion: string) {
  if (!activeSpecialist.value) {
    roleModalOpen.value = true
    return
  }
  const attachment = attachedFile.value
  const question = rawQuestion.trim() || (attachment ? 'ช่วยวิเคราะห์ไฟล์นี้ให้หน่อย' : '')
  if (!question || isStreaming.value) return

  const specialist = roleForConversation(activeSpecialist.value)
  let attachmentPayload: { name: string; content: string } | null = null
  if (attachment) {
    try {
      attachmentPayload = { name: attachment.name, content: (await attachment.text()).slice(0, 20000) }
    } catch {
      toast.error('อ่านไฟล์ไม่สำเร็จ', 'กรุณาตรวจสอบไฟล์ CSV แล้วลองใหม่')
      return
    }
  }
  const historyPayload = messages.value
    .filter((message) => message.content.trim() && !message.error && !message.streaming)
    .slice(-12)
    .map((message) => ({ role: message.role, content: message.content }))
  const agentIds = activeBoardroomAgents.value
    .filter((agent) => agent.enabled)
    .map((agent) => agent.id)
    .slice(0, 6)
  composer.value = ''
  attachedFile.value = null
  if (!activeId.value) {
    const conversation = createConversation(question.slice(0, 56))
    conversation.specialistRole = specialist
    history.value.unshift(conversation)
    activeId.value = conversation.id
  }

  const conversationId = activeId.value
  if (conversationId) {
    void router.navigate({ to: '/app/assistant', search: { chat: conversationId }, replace: true })
  }
  const userContent = attachment ? `${question}\n\n[ไฟล์แนบ: ${attachment.name}]` : question
  const userMessage = createMessage('user', userContent)
  userMessage.specialistRole = specialist
  const assistantMessage = createMessage('assistant')
  assistantMessage.specialistRole = specialist
  messages.value.push(userMessage)
  messages.value.push(assistantMessage)
  const answerIndex = messages.value.length - 1
  isStreaming.value = true
  stopRequested.value = false
  streamController = new AbortController()
  await nextTick()
  scrollToBottom()

  try {
    for await (const event of streamAiReply(question, {
      industryId: industryFocus.value,
      specialistRole: specialist,
      agentIds,
      history: historyPayload,
      attachment: attachmentPayload,
      signal: streamController.signal,
    })) {
      if (stopRequested.value) break
      if (event.type === 'token') {
        messages.value[answerIndex].content += event.value ?? ''
        queueScroll()
      } else if (event.type === 'citation' && event.citation) {
        messages.value[answerIndex].citations?.push(event.citation)
        queueScroll()
      } else if (event.type === 'error') {
        throw new Error(event.message ?? 'AI ไม่สามารถตอบได้ในขณะนี้')
      }
    }
  } catch (error) {
    const answer = messages.value[answerIndex]
    if (!stopRequested.value && !streamController?.signal.aborted) {
      answer.error = true
      if (!answer.content.trim()) {
        answer.content = 'ขออภัยครับ ระบบไม่สามารถสร้างคำตอบได้ในขณะนี้ กรุณาลองถามอีกครั้ง'
      }
      toast.error('AI ตอบไม่สำเร็จ', error instanceof Error ? error.message : 'กรุณาลองใหม่')
    }
  } finally {
    const answer = messages.value[answerIndex]
    if (answer) {
      if (stopRequested.value && !answer.content.trim()) {
        answer.content = 'หยุดการตอบแล้ว'
      }
      answer.streaming = false
    }
    isStreaming.value = false
    stopRequested.value = false
    streamController = null
    syncConversation(conversationId)
    await nextTick()
    scrollToBottom()
  }
}

function chooseConversation(conversation: Conversation) {
  if (isStreaming.value) {
    selectConversation(conversation)
    return
  }
  selectConversation(conversation)
  historyOpen.value = false
  void router.navigate({
    to: '/app/assistant',
    search: { chat: conversation.id },
    replace: true,
  })
}

function newChatFromHistory() {
  if (isStreaming.value) {
    toast.info('กำลังสร้างคำตอบ', 'กดหยุดคำตอบก่อนเริ่มแชทใหม่')
    return
  }
  ignoreNextChatReset = true
  startNewChat()
  historyOpen.value = false
  void router.navigate({ to: '/app/assistant', search: { chat: 'new' }, replace: true })
}

function stopAnswer() {
  stopRequested.value = true
  streamController?.abort()
}

function toggleVoiceInput() {
  if (isListening.value) {
    isListening.value = false
    toast.info('หยุดการบันทึกเสียง', '')
  } else {
    isListening.value = true
    toast.info('พร้อมรับคำสั่งเสียง', 'กำลังฟังคำสั่งของคุณ...')
    setTimeout(() => {
      if (isListening.value) {
        isListening.value = false
        composer.value = 'สรุปภาพรวมธุรกิจและแนวโน้มกำไร 6 เดือนล่าสุดให้หน่อย'
        toast.success('แปลงเสียงเป็นข้อความเรียบร้อย')
      }
    }, 2400)
  }
}

function openComposerSettings() {
  void router.navigate({ to: '/app/settings' })
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault()
    void send(composer.value)
  }
}

function handleFeedback(messageId: string, value: 'up' | 'down' | null) {
  const message = messages.value.find((item) => item.id === messageId)
  if (!message) return
  message.feedback = value
  if (activeId.value) syncConversation(activeId.value)
  else saveConversations(history.value)
  if (value) toast.success('ขอบคุณสำหรับความคิดเห็น', 'เราจะใช้ปรับคุณภาพคำตอบต่อไป')
}

async function copyMessage(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('คัดลอกคำตอบแล้ว')
  } catch {
    toast.error('คัดลอกไม่สำเร็จ', 'เบราว์เซอร์ไม่อนุญาตให้เข้าถึงคลิปบอร์ด')
  }
}
</script>

<template>
  <div class="flex h-full min-h-0 overflow-hidden bg-white">
  <section
    class="relative flex min-w-0 flex-1 flex-col bg-white"
    :class="messages.length === 0 ? 'overflow-y-auto' : 'overflow-hidden'"
  >
    <!-- Top Left: Multi-Agent Boardroom & Vault trigger -->
    <div class="absolute left-14 top-3 z-20 flex items-center gap-2 transition-all duration-200 lg:left-4">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-full bg-[#f4f5f7] px-2.5 py-1 text-xs font-medium text-ink transition hover:bg-[#eceef1]"
        @click="openVaultGeneral"
      >
        <Users class="h-3.5 w-3.5 text-muted" />
        <span>ทีม AI ({{ activeBoardroomAgents.length }})</span>
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-full bg-[#f4f5f7] px-2.5 py-1 text-xs font-medium text-ink transition hover:bg-[#eceef1]"
        @click="openChatPicker"
      >
        <History class="h-3.5 w-3.5 text-muted" />
        <span>เลือกแชท</span>
      </button>
    </div>

    <button
      type="button"
      class="absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#f4f5f7] text-ink transition hover:bg-[#eceef1] xl:hidden"
      aria-label="เปิดประวัติแชท"
      @click="historyOpen = true"
    >
      <PanelRightOpen class="h-4 w-4" aria-hidden="true" />
    </button>
    <button
      type="button"
      :class="[
        'absolute right-3 top-3 z-20 hidden h-9 w-9 items-center justify-center rounded-full bg-[#f4f5f7] text-ink transition-all duration-300 hover:bg-[#eceef1] xl:inline-flex',
        historyCollapsed
          ? 'opacity-100 pointer-events-auto scale-100 delay-150'
          : 'opacity-0 pointer-events-none scale-90 delay-0',
      ]"
      aria-label="เปิดประวัติแชท"
      @click="historyCollapsed = false"
    >
      <PanelRightOpen class="h-4 w-4" aria-hidden="true" />
    </button>

    <div
      :class="messages.length === 0 ? 'my-auto flex w-full flex-col' : 'flex min-h-0 flex-1 flex-col'"
    >
    <div
      ref="messageList"
      class="no-scrollbar px-4 sm:px-6"
      :class="messages.length === 0 ? 'pb-0 pt-6' : 'min-h-0 flex-1 overflow-y-auto pb-4 pt-16 sm:pb-6'"
      role="log"
      aria-label="บทสนทนากับ AI"
      aria-live="polite"
      :aria-busy="isStreaming || undefined"
    >
      <div v-if="historyPending" class="mx-auto w-full max-w-3xl space-y-6">
        <div class="skeleton ml-auto h-12 w-1/2 rounded-2xl" />
        <div class="skeleton h-24 w-4/5 rounded-2xl" />
      </div>

      <div v-else-if="messages.length === 0" class="flex flex-col">
        <div class="mx-auto w-full max-w-2xl text-center">
          <h3 class="text-[32px] font-bold tracking-tight text-ink sm:text-[38px]">
            ยินดีต้อนรับ, {{ firstName }}!
          </h3>
          <p class="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-muted">
            วันนี้อยากให้ ROOKAR ช่วยวิเคราะห์อะไรดีครับ?
          </p>

          <button
            type="button"
            class="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#f4f5f7] px-3 py-1.5 text-[11.5px] font-semibold text-ink transition hover:bg-[#eceef1]"
            @click="roleModalOpen = true"
          >
            <Info class="h-3.5 w-3.5 text-muted" aria-hidden="true" />
            ดูรายละเอียดผู้เชี่ยวชาญ
          </button>

        </div>
      </div>

      <div v-else class="mx-auto w-full max-w-3xl space-y-7">
        <ChatBubble
          v-for="message in messages"
          :key="message.id"
          :message="message"
          @feedback="(value) => handleFeedback(message.id, value)"
          @copy="copyMessage"
        />
      </div>
    </div>

    <div
      class="shrink-0 px-4 sm:px-6"
      :class="messages.length === 0 ? 'pb-6 pt-6 sm:pb-8 sm:pt-8' : 'pb-4 pt-2 sm:pb-6 sm:pt-3'"
    >
      <div class="mx-auto w-full max-w-3xl">
        <!-- Quick Prompts from Active Specialist Role -->
        <div v-if="activeSpecialist" class="mb-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          <span class="shrink-0 text-[11px] font-semibold text-muted flex items-center gap-1 mr-1">
            <component :is="specialistRoles.find(r => r.id === activeSpecialist)?.icon" class="h-3 w-3" />
            {{ specialistRoles.find(r => r.id === activeSpecialist)?.label }}:
          </span>
          <button
            v-for="qp in quickPrompts"
            :key="qp"
            type="button"
            class="shrink-0 rounded-full bg-[#f4f5f7] px-3 py-1 text-[11px] font-medium text-ink hover:bg-[#eceef1] transition"
            @click="send(qp)"
          >
            {{ qp }}
          </button>
        </div>

        <div class="card-fade-static p-3">
          <div
            v-if="attachedFile"
            class="mb-2 flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[11.5px] text-ink-soft"
          >
            <FileSpreadsheet class="h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden="true" />
            <span class="min-w-0 flex-1 truncate">{{ attachedFile.name }}</span>
            <button
              type="button"
              class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-neutral-200 hover:text-ink focus-visible:bg-neutral-200 focus-visible:text-ink"
              aria-label="เอาไฟล์แนบออก"
              @click="removeAttachment"
            >
              <X class="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
          <div class="flex items-start gap-2.5 px-3 pt-1">
            <div class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100">
              <img src="/ai-avatar.png" alt="ROOKAR AI" class="h-full w-full object-cover" />
            </div>
            <textarea
              ref="composerEl"
              v-model="composer"
              rows="1"
              maxlength="1000"
              :disabled="!activeSpecialist || isStreaming"
              :placeholder="activeSpecialist ? '✦ ถามเกี่ยวกับยอดขาย ต้นทุน หรือสั่งให้ AI วิเคราะห์...' : 'เลือกผู้เชี่ยวชาญก่อนเริ่มพิมพ์…'"
              class="max-h-[132px] min-h-[32px] flex-1 resize-none bg-transparent py-0.5 text-[13.5px] leading-relaxed text-ink placeholder:text-muted/65 focus:outline-none disabled:cursor-not-allowed"
              aria-label="คำถามถึง AI"
              @keydown="handleKeydown"
            />
          </div>
          <div class="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              class="inline-flex h-8.5 items-center gap-1.5 rounded-full bg-white px-3.5 text-[11.5px] font-medium text-ink-soft transition hover:bg-neutral-100 hover:text-ink focus-visible:bg-neutral-100 focus-visible:text-ink disabled:pointer-events-none disabled:opacity-45"
              :disabled="!activeSpecialist || isStreaming"
              aria-label="แนบไฟล์"
              @click="pickFile"
            >
              <Paperclip class="h-3.5 w-3.5" aria-hidden="true" />
              แนบไฟล์
            </button>
            <input
              ref="fileInput"
              type="file"
              class="sr-only"
              accept=".csv"
              @change="handleFileChange"
            />
            <button
              type="button"
              class="inline-flex h-8.5 items-center gap-1.5 rounded-full bg-ink-50/90 px-3.5 text-[11.5px] font-medium text-ink-soft transition hover:bg-ink-100 hover:text-ink focus-visible:bg-ink-100 focus-visible:text-ink"
              aria-label="ตั้งค่า AI"
              @click="openComposerSettings"
            >
              <SettingsIcon class="h-3.5 w-3.5" aria-hidden="true" />
              ตั้งค่า
            </button>
            <button
              type="button"
              class="inline-flex h-8.5 items-center gap-1.5 rounded-full bg-ink-50/90 px-3.5 text-[11.5px] font-medium text-ink-soft transition hover:bg-ink-100 hover:text-ink focus-visible:bg-ink-100 focus-visible:text-ink"
              aria-label="บริบท AI"
              @click="contextOpen = true"
            >
              <SlidersHorizontal class="h-3.5 w-3.5" aria-hidden="true" />
              บริบท AI
            </button>

            <div class="flex-1" />

            <button
              type="button"
              :class="[
                'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors disabled:pointer-events-none disabled:opacity-40',
                isListening ? 'bg-rose-500 text-white' : 'text-muted hover:bg-neutral-200 hover:text-ink'
              ]"
              :disabled="!activeSpecialist"
              aria-label="คำสั่งเสียง (Voice input)"
              title="คำสั่งเสียง (Voice input)"
              @click="toggleVoiceInput"
            >
              <Mic class="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              v-if="isStreaming"
              type="button"
              class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink transition hover:bg-ink-200"
              aria-label="หยุดการตอบ"
              @click="stopAnswer"
            >
              <CircleStop class="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              v-else
              type="button"
              class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-white transition hover:bg-black disabled:bg-ink-100 disabled:text-faint"
              :disabled="!activeSpecialist || (!composer.trim() && !attachedFile)"
              aria-label="ส่งคำถาม"
              @click="send(composer)"
            >
              <ArrowUp class="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  </section>

  <!-- Desktop Chat History Sidebar (Silky Smooth Negative-Margin Slide) -->
  <aside
    :class="[
      'relative hidden h-full shrink-0 p-3 xl:block',
      'transition-[margin] duration-300 ease-in-out will-change-[margin-right]',
    ]"
    :style="{
      width: `${historyPanelWidth}px`,
      marginRight: historyCollapsed ? `-${historyPanelWidth}px` : '0px',
    }"
    aria-label="ประวัติการสนทนา"
  >
    <div class="card-fade-static h-full overflow-hidden">
      <ChatHistory
        :conversations="history"
        :active-id="activeId"
        :loading="historyPending"
        closable
        @select="chooseConversation"
        @new-chat="newChatFromHistory"
        @close="historyCollapsed = true"
      />
    </div>
  </aside>

  <AppSheet
    :open="contextOpen"
    title="บริบท AI"
    description="ข้อมูลและคำถามที่ใช้ประกอบการตอบ"
    side="right"
    @update:open="contextOpen = $event"
  >
    <div class="space-y-3">
      <section class="bg-ink-50 p-4">
        <div class="flex items-start justify-between gap-2">
          <div>
            <h3 class="text-[13px] font-semibold text-ink">ข้อมูลที่ AI ใช้</h3>
            <p class="mt-0.5 text-[11px] text-muted">{{ formatNumber(totalRows) }} แถวจาก {{ sources?.length ?? 0 }} แหล่งข้อมูล</p>
          </div>
          <Database class="h-4 w-4 text-brand-400" aria-hidden="true" />
        </div>

        <ul class="mt-3 space-y-2">
          <li v-for="source in (sources ?? []).slice(0, 4)" :key="source.id" class="flex items-center gap-2">
            <FileSpreadsheet class="h-4 w-4 shrink-0 text-brand-400" aria-hidden="true" />
            <div class="min-w-0 flex-1">
              <span class="block truncate text-[12px] font-medium text-ink">{{ source.name }}</span>
              <span class="block text-[10.5px] text-muted">{{ formatNumber(source.rowCount) }} แถว · {{ source.period }}</span>
            </div>
          </li>
        </ul>
      </section>

      <section class="bg-ink-50 p-4">
        <h3 class="text-[13px] font-semibold text-ink">ลองถามแบบนี้</h3>
        <div class="mt-2.5 space-y-1.5">
          <button
            v-for="prompt in quickPrompts"
            :key="prompt"
            type="button"
            class="flex h-10 w-full items-center justify-between gap-2 rounded-lg bg-surface px-3 text-left text-[11.5px] leading-relaxed text-ink-soft transition hover:text-brand-900"
            @click="send(prompt); contextOpen = false"
          >
            {{ prompt }}
            <SendHorizontal class="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
          </button>
        </div>
      </section>

      <section class="rounded-2xl bg-neutral-900 p-4 text-white">
        <div class="flex items-center gap-1.5">
          <ShieldCheck class="h-4 w-4 text-white" aria-hidden="true" />
          <h3 class="text-[12px] font-semibold text-white">ข้อมูลของคุณเป็นส่วนตัว</h3>
        </div>
        <p class="mt-1.5 text-[11px] leading-relaxed text-neutral-300">
          ข้อมูลและบทสนทนาถูกเก็บไว้ในเบราว์เซอร์ของคุณเท่านั้น
        </p>
      </section>
    </div>
  </AppSheet>

  <AppSheet
    :open="historyOpen"
    title="ประวัติแชท"
    side="right"
    hide-header
    :padded="false"
    width="w-[min(340px,92vw)]"
    @update:open="historyOpen = $event"
  >
    <ChatHistory
      :conversations="history"
      :active-id="activeId"
      :loading="historyPending"
      closable
      @select="chooseConversation"
      @new-chat="newChatFromHistory"
      @close="historyOpen = false"
    />
  </AppSheet>

  <AppModal
    :open="chatPickerOpen"
    title="เลือกบทสนทนา"
    description="เลือกแชทที่ต้องการคุยต่อ หรือเริ่มแชทใหม่"
    size="lg"
    @update:open="chatPickerOpen = $event"
  >
    <div class="space-y-3">
      <button
        type="button"
        class="flex w-full items-center gap-3 rounded-2xl bg-black px-4 py-3 text-left text-white transition hover:bg-neutral-800"
        @click="startNewChatFromPicker"
      >
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
          <Plus class="h-4 w-4" aria-hidden="true" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block text-[13px] font-semibold">เริ่มแชทใหม่</span>
          <span class="block text-[11.5px] text-neutral-300">เลือกผู้เชี่ยวชาญ AI ก่อนเริ่มพิมพ์</span>
        </span>
      </button>

      <div v-if="history.length === 0" class="rounded-2xl border border-dashed border-neutral-300 p-8 text-center">
        <p class="text-[13px] font-semibold text-ink">ยังไม่มีประวัติแชท</p>
        <p class="mt-1 text-[11.5px] text-muted">เริ่มแชทใหม่เพื่อให้ ROOKAR ช่วยวิเคราะห์ธุรกิจของคุณ</p>
      </div>

      <div v-else class="space-y-2">
        <button
          v-for="conversation in history"
          :key="conversation.id"
          type="button"
          class="flex w-full items-start gap-3 rounded-2xl bg-white p-4 text-left ring-1 ring-black/5 transition hover:ring-black/15"
          @click="chooseConversationFromPicker(conversation)"
        >
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-ink">
            <MessageSquare class="h-4 w-4" aria-hidden="true" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="flex items-center gap-2">
              <span class="truncate text-[13px] font-semibold text-ink">{{ conversation.title }}</span>
              <span class="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-muted">
                {{ roleLabel(conversation.specialistRole) }}
              </span>
            </span>
            <span class="mt-0.5 block truncate text-[11.5px] text-muted">{{ conversation.preview || 'ยังไม่มีข้อความ' }}</span>
          </span>
          <span class="shrink-0 text-[10.5px] text-muted">{{ timeAgo(conversation.updatedAt) }}</span>
        </button>
      </div>
    </div>
  </AppModal>

  <AppModal
    :open="roleModalOpen"
    title="เลือกผู้เชี่ยวชาญ AI"
    description="เลือกบทบาทก่อนเริ่มพิมพ์คำถาม ROOKAR จะใช้มุมมองนี้ตลอดบทสนทนา"
    size="lg"
    @update:open="roleModalOpen = $event"
  >
    <div class="grid gap-3 sm:grid-cols-2">
      <button
        v-for="role in specialistRoles"
        :key="role.id"
        type="button"
        :class="[
          'flex items-start gap-3 rounded-2xl border p-4 text-left transition',
          activeSpecialist === role.id
            ? 'border-black bg-ink-50'
            : 'border-black/10 bg-white hover:border-black/20 hover:bg-neutral-50',
        ]"
        @click="selectSpecialist(role.id)"
      >
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-ink ring-1 ring-black/5">
          <component :is="role.icon" class="h-5 w-5" aria-hidden="true" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block text-[13px] font-semibold text-ink">{{ role.label }}</span>
          <span class="mt-0.5 block text-[11.5px] leading-relaxed text-muted">{{ role.desc }}</span>
        </span>
        <Check v-if="activeSpecialist === role.id" class="mt-0.5 h-4 w-4 shrink-0 text-ink" aria-hidden="true" />
      </button>
    </div>
  </AppModal>

  <!-- Agent Vault & Custom Boardroom Modal with Chat Permissions & Logic Inspector -->
  <AgentVaultModal
    v-model:open="showAgentVault"
    :current-chat-id="activeId"
    :conversations="history"
    :initial-agent-id="inspectAgentId"
  />
  </div>
</template>