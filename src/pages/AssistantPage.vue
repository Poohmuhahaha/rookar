<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter, useSearch } from '@tanstack/vue-router'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  ArrowUp,
  CircleStop,
  Database,
  FileSpreadsheet,
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
} from '@lucide/vue'
import AppSheet from '@/components/ui/AppSheet.vue'
import ChatBubble from '@/components/features/ChatBubble.vue'
import ChatHistory from '@/components/features/ChatHistory.vue'
import WelcomeMark from '@/components/brand/WelcomeMark.vue'
import PastelIcon from '@/components/brand/PastelIcon.vue'
import { createConversation, createMessage, getConversations, getSession, listSources, saveConversations, streamAiReply } from '@/lib/mockApi'
import { formatNumber } from '@/lib/format'
import { sidebarCollapsed } from '@/lib/shell'
import { useToast } from '@/lib/toast'
import type { ChatMessage, Conversation } from '@/types'

const router = useRouter()
const routeSearch = useSearch({ from: '/app/assistant' })
const queryClient = useQueryClient()
const toast = useToast()
const session = getSession()

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
const contextOpen = ref(false)
const historyOpen = ref(false)
const historyCollapsed = ref(localStorage.getItem('rookar.assistant.history-collapsed') === '1')
const initialized = ref(false)
const messageList = ref<HTMLElement | null>(null)
const composerEl = ref<HTMLTextAreaElement | null>(null)
let scrollFrame: number | null = null

const firstName = computed(() => session?.user.name.split(' ')[0] ?? 'คุณ')
const totalRows = computed(() => (sources.value ?? []).reduce((sum, source) => sum + source.rowCount, 0))

type SpecialistRole = 'all' | 'finance' | 'market' | 'strategy' | 'planning'

const activeSpecialist = ref<SpecialistRole>('all')

const specialistRoles = [
  { id: 'all' as const, label: 'ภาพรวม (All)', icon: Sparkles, desc: 'มองภาพรวมธุรกิจและเชื่อมโยงทุกมิติ' },
  { id: 'finance' as const, label: 'การเงิน & ต้นทุน', icon: Wallet, desc: 'เจาะลึกต้นทุนวัตถุดิบ ค่าแรง และสภาพคล่อง' },
  { id: 'market' as const, label: 'ตลาด & GDP', icon: TrendingUp, desc: 'วิเคราะห์เทียบ GDP สศช. และกำลังซื้อ ธปท.' },
  { id: 'strategy' as const, label: 'กลยุทธ์ & ราคา', icon: Target, desc: 'ตั้งราคา แข่งขันในตลาด และรักษา Margin' },
  { id: 'planning' as const, label: 'แผนธุรกิจ (Planning)', icon: Rocket, desc: 'จัดทำ Action Plan ปฏิบัติการ 30 วัน' },
]

const suggestionsByRole: Record<SpecialistRole, { type: 'star' | 'pencil' | 'palette'; title: string; description: string; prompt: string }[]> = {
  all: [
    {
      type: 'star',
      title: 'เปรียบเทียบตลาด & GDP',
      description: 'เทียบการเติบโตร้านกับ GDP ภาคบริการ (+3.8%) และเงินเฟ้อ',
      prompt: 'วิเคราะห์ยอดขายร้านเทียบกับ GDP ประเทศและสภาวะตลาดให้หน่อย',
    },
    {
      type: 'pencil',
      title: 'กลยุทธ์ราคาในภาวะเงินเฟ้อ',
      description: 'แนะนำการตั้งราคาและรักษา Margin ท่ามกลางต้นทุนวัตถุดิบผันผวน',
      prompt: 'เงินเฟ้อและต้นทุนแบบนี้ ควรตั้งราคาหรือลดต้นทุนอย่างไร',
    },
    {
      type: 'palette',
      title: 'จำลองฉากทัศน์ What-if',
      description: 'คำนวณกำไรคาดการณ์หากลดต้นทุนวัตถุดิบลง 5%',
      prompt: 'จำลองฉากทัศน์ What-if หากลดต้นทุนวัตถุดิบลง 5% กำไรสุทธิจะเป็นอย่างไร',
    },
  ],
  finance: [
    {
      type: 'star',
      title: 'วิเคราะห์ต้นทุนวัตถุดิบ 52%',
      description: 'เจาะลึกวัตถุดิบและบรรจุภัณฑ์ที่เพิ่มขึ้น 6.2%',
      prompt: 'ต้นทุนไหนกินกำไรมากที่สุด และลดตัวไหนได้เร็วที่สุด',
    },
    {
      type: 'palette',
      title: 'จุดคุ้มทุน (Break-even)',
      description: 'คำนวณยอดขายขั้นต่ำต่อวันเพื่อไม่ให้ร้านขาดทุน',
      prompt: 'คำนวณจุดคุ้มทุน (Break-even point) และยอดขายขั้นต่ำต่อวันให้หน่อย',
    },
    {
      type: 'pencil',
      title: 'ควบคุมค่าใช้จ่ายดำเนินงาน',
      description: 'บริหารจัดการค่าไฟ ค่าเช่า และค่าแรงให้สอดคล้องยอดขาย',
      prompt: 'ช่วยวางแผนควบคุมค่าใช้จ่ายดำเนินงานและค่าแรงพนักงาน',
    },
  ],
  market: [
    {
      type: 'star',
      title: 'เทียบยอดขายกับ GDP สศช.',
      description: 'ร้านโต 12.4% เทียบ GDP ภาคบริการ (+3.8%)',
      prompt: 'วิเคราะห์ยอดขายร้านเทียบกับ GDP ประเทศและสภาวะตลาดให้หน่อย',
    },
    {
      type: 'pencil',
      title: 'ดัชนีบริโภคเอกชน ธปท.',
      description: 'กำลังซื้อผู้บริโภคโต 2.1% กระทบยอดขายกาแฟอย่างไร',
      prompt: 'กำลังซื้อและดัชนีบริโภคของ ธปท. ส่งผลต่อยอดขายกาแฟอย่างไร',
    },
    {
      type: 'palette',
      title: 'โอกาสจากเทศกาลและท่องเที่ยว',
      description: 'เตรียมสต็อกและโปรโมชันรองรับลูกค้าช่วงไฮซีซั่น',
      prompt: 'แนวโน้มท่องเที่ยวและเทศกาลปลายปี จะดันยอดขายร้านได้แค่ไหน',
    },
  ],
  strategy: [
    {
      type: 'star',
      title: 'กลยุทธ์ราคา (Tiered Pricing)',
      description: 'คงราคาเมนูหลัก ปรับเฉพาะพรีเมียมเพื่อรักษาลูกค้า',
      prompt: 'เงินเฟ้อและต้นทุนแบบนี้ ควรตั้งราคาหรือลดต้นทุนอย่างไร',
    },
    {
      type: 'pencil',
      title: 'จัดเซ็ตคอมโบดันยอดต่อบิล',
      description: 'เพิ่ม Basket size จาก ฿318 เป็น ฿360 ด้วยเครื่องดื่มคู่เบเกอรี่',
      prompt: 'แนะนำการจัดชุดเซ็ตเมนู (Bundling) เพื่อดันกำไรต่อบิล',
    },
    {
      type: 'palette',
      title: 'จำลองฉากทัศน์ราคา What-if',
      description: 'ถ้าปรับราคาขึ้น 5% ลูกค้าลดลง 2% กำไรสุทธิจะเป็นอย่างไร',
      prompt: 'จำลองฉากทัศน์ What-if หากลดต้นทุนวัตถุดิบลง 5% กำไรสุทธิจะเป็นอย่างไร',
    },
  ],
  planning: [
    {
      type: 'star',
      title: 'Action Plan 30 วันแรก',
      description: 'ลำดับขั้นตอนปฏิบัติเพื่อลดต้นทุนบรรจุภัณฑ์และเพิ่มกำไร',
      prompt: 'สรุป Action Plan สำหรับ 30 วันข้างหน้าในการลดต้นทุนและรักษากำไร',
    },
    {
      type: 'pencil',
      title: 'ตั้งเป้าหมาย KPI ไตรมาสหน้า',
      description: 'กำหนดเป้า Gross Margin 28% และยอดขายเติบโตต่อเนื่อง',
      prompt: 'ช่วยวางเป้าหมาย KPI และตัวชี้วัดสำคัญสำหรับไตรมาสถัดไป',
    },
    {
      type: 'palette',
      title: 'แผนเพิ่มยอดขาย Delivery',
      description: 'ประเมินความคุ้มค่าค่า GP และการเพิ่มยอดขายนอกร้าน',
      prompt: 'วางแผนเพิ่มสัดส่วนยอดขาย Delivery โดยไม่ให้กระทบกำไรสุทธิ',
    },
  ],
}

const currentSuggestions = computed(() => suggestionsByRole[activeSpecialist.value] || suggestionsByRole.all)

const quickPrompts = computed(() => {
  if (activeSpecialist.value === 'finance') {
    return ['ต้นทุนไหนกินกำไรที่สุด', 'คำนวณจุดคุ้มทุนรายวัน', 'ควบคุมค่าแรงพนักงาน', 'บริหารกระแสเงินสด']
  }
  if (activeSpecialist.value === 'market') {
    return ['ยอดขายโตเพราะเรา หรือเพราะตลาดพาไป?', 'วิเคราะห์เทียบ GDP สศช.', 'กำลังซื้อผู้บริโภค ธปท.', 'แนวโน้มท่องเที่ยวปลายปี']
  }
  if (activeSpecialist.value === 'strategy') {
    return ['กลยุทธ์ตั้งราคาในภาวะเงินเฟ้อ', 'จัดเซ็ตเมนูดันยอดบิล', 'เจรจาซัพพลายเออร์ลดต้นทุน', 'รักษาลูกค้าประจำ']
  }
  if (activeSpecialist.value === 'planning') {
    return ['สรุป Action Plan 30 วัน', 'วางเป้าหมาย KPI ไตรมาสถัดไป', 'แผนควบคุมต้นทุนบรรจุภัณฑ์', 'ขั้นตอนเตรียมรับไฮซีซั่น']
  }
  return [
    'ยอดขายโตเพราะเรา หรือเพราะตลาดพาไป?',
    'วิเคราะห์เทียบ GDP & เงินเฟ้อ',
    'กลยุทธ์ตั้งราคาในภาวะเงินเฟ้อ',
    'ต้นทุนไหนกินกำไรที่สุด',
  ]
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
      startNewChat()
      void send(pendingPrompt)
    } else if (pendingChat && pendingChat !== 'new') {
      const conversation = history.value.find((item) => item.id === pendingChat)
      if (conversation) selectConversation(conversation)
      else startNewChat()
    } else {
      startNewChat()
    }
  },
  { immediate: true },
)

watch(
  () => routeSearch.value.prompt,
  (prompt, previous) => {
    if (!initialized.value || !prompt || prompt === previous) return
    startNewChat()
    void send(prompt)
  },
)

watch(
  () => routeSearch.value.chat,
  (chat, previous) => {
    if (!initialized.value || chat === previous) return
    if (!chat || chat === 'new') {
      if (activeId.value !== null) startNewChat()
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
  messages.value = cloneMessages(conversation.messages)
  nextTick(scrollToBottom)
}

function startNewChat() {
  if (isStreaming.value) {
    toast.info('กำลังสร้างคำตอบ', 'กดหยุดคำตอบก่อนเริ่มแชทใหม่')
    return
  }
  activeId.value = null
  messages.value = []
  composer.value = ''
  contextOpen.value = false
  nextTick(() => composerEl.value?.focus())
}

function syncConversation(conversationId: string) {
  const conversation = history.value.find((item) => item.id === conversationId)
  if (!conversation) return
  conversation.messages = cloneMessages(messages.value)
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

  const allowed = ['.csv', '.xlsx', '.xls']
  if (!allowed.some((extension) => file.name.toLowerCase().endsWith(extension))) {
    toast.error('ไฟล์ไม่รองรับ', 'รองรับไฟล์ CSV หรือ Excel')
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
  const attachment = attachedFile.value
  const question = rawQuestion.trim() || (attachment ? 'ช่วยวิเคราะห์ไฟล์นี้ให้หน่อย' : '')
  if (!question || isStreaming.value) return

  composer.value = ''
  attachedFile.value = null
  if (!activeId.value) {
    const conversation = createConversation(question.slice(0, 56))
    history.value.unshift(conversation)
    activeId.value = conversation.id
  }

  const conversationId = activeId.value
  if (conversationId) {
    void router.navigate({ to: '/app/assistant', search: { chat: conversationId }, replace: true })
  }
  const userContent = attachment ? `${question}\n\n[ไฟล์แนบ: ${attachment.name}]` : question
  messages.value.push(createMessage('user', userContent))
  messages.value.push(createMessage('assistant'))
  const answerIndex = messages.value.length - 1
  isStreaming.value = true
  stopRequested.value = false
  await nextTick()
  scrollToBottom()

  try {
    for await (const event of streamAiReply(question)) {
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
    answer.error = true
    if (!answer.content.trim()) {
      answer.content = 'ขออภัยครับ ระบบไม่สามารถสร้างคำตอบได้ในขณะนี้ กรุณาลองถามอีกครั้ง'
    }
    toast.error('AI ตอบไม่สำเร็จ', error instanceof Error ? error.message : 'กรุณาลองใหม่')
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
  startNewChat()
  historyOpen.value = false
  void router.navigate({ to: '/app/assistant', search: {}, replace: true })
}

function stopAnswer() {
  stopRequested.value = true
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
  toast.info('การตั้งค่าโมเดล AI', 'ใช้โมเดล ROOKAR Intelligence v2.4 (High Precision)')
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
  <div class="flex h-full min-h-0 bg-white">
  <section class="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
    <button
      type="button"
      class="absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#f4f5f7] text-ink transition hover:bg-[#eceef1] xl:hidden"
      aria-label="เปิดประวัติแชท"
      @click="historyOpen = true"
    >
      <PanelRightOpen class="h-4 w-4" aria-hidden="true" />
    </button>
    <button
      v-if="historyCollapsed"
      type="button"
      class="absolute right-3 top-3 z-20 hidden h-9 w-9 items-center justify-center rounded-full bg-[#f4f5f7] text-ink transition hover:bg-[#eceef1] xl:inline-flex"
      aria-label="เปิดประวัติแชท"
      @click="historyCollapsed = false"
    >
      <PanelRightOpen class="h-4 w-4" aria-hidden="true" />
    </button>

    <div
      ref="messageList"
      :class="[
        'no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6',
        sidebarCollapsed ? 'pt-16' : 'pt-16 xl:pt-8',
      ]"
      role="log"
      aria-label="บทสนทนากับ AI"
      aria-live="polite"
      :aria-busy="isStreaming || undefined"
    >
      <div v-if="historyPending" class="mx-auto w-full max-w-3xl space-y-6">
        <div class="skeleton ml-auto h-12 w-1/2 rounded-2xl" />
        <div class="skeleton h-24 w-4/5 rounded-2xl" />
      </div>

      <div v-else-if="messages.length === 0" class="flex h-full flex-col justify-center py-4 sm:justify-start sm:pt-[11vh]">
        <div class="mx-auto w-full max-w-2xl text-center">
          <div class="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-neutral-100">
            <img src="/ai-avatar.png" alt="ROOKAR AI" class="h-full w-full object-cover" />
          </div>
          <h3 class="mt-4 text-[32px] font-bold tracking-tight text-ink sm:text-[38px]">
            ยินดีต้อนรับ, {{ firstName }}!
          </h3>
          <p class="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-muted">
            วันนี้อยากให้ ROOKAR ช่วยวิเคราะห์อะไรดีครับ?
          </p>

          <!-- Specialist AI Role Switcher (ตาม Slide 3 & 4 ของ Pitch Deck) -->
          <div class="mt-6 flex flex-wrap items-center justify-center gap-1.5 p-1 rounded-2xl bg-[#f4f5f7] max-w-2xl mx-auto">
            <button
              v-for="role in specialistRoles"
              :key="role.id"
              type="button"
              :class="[
                'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition',
                activeSpecialist === role.id ? 'bg-black text-white shadow-xs' : 'text-neutral-600 hover:text-black hover:bg-white/80'
              ]"
              @click="activeSpecialist = role.id"
            >
              <component :is="role.icon" class="h-3.5 w-3.5" />
              <span>{{ role.label }}</span>
            </button>
          </div>

          <div class="mt-7 grid grid-cols-1 gap-3.5 text-left sm:grid-cols-3">
            <button
              v-for="suggestion in currentSuggestions"
              :key="suggestion.title"
              type="button"
              class="card-fade group p-5 text-left transition-all duration-300 focus-visible:outline-none"
              @click="send(suggestion.prompt)"
            >
              <!-- Card Content: Fastwork Flat Bento Style -->
              <div class="relative z-10 flex min-h-[120px] flex-col justify-between">
                <div>
                  <PastelIcon :type="suggestion.type" />
                  <span class="mt-4 block text-[13.5px] font-bold tracking-tight text-ink">{{ suggestion.title }}</span>
                </div>
                <span class="mt-3 block text-[11px] font-medium leading-relaxed text-muted">{{ suggestion.description }}</span>
              </div>
            </button>
          </div>
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

    <div class="shrink-0 px-4 pb-4 pt-2 sm:px-6 sm:pb-6 sm:pt-3">
      <div class="mx-auto w-full max-w-3xl">
        <!-- Quick Prompts from Active Specialist Role -->
        <div class="mb-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
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
              placeholder="✦ ถามเกี่ยวกับยอดขาย ต้นทุน หรือสั่งให้ AI วิเคราะห์..."
              class="max-h-[132px] min-h-[32px] flex-1 resize-none bg-transparent py-0.5 text-[13.5px] leading-relaxed text-ink placeholder:text-muted/65 focus:outline-none"
              aria-label="คำถามถึง AI"
              @keydown="handleKeydown"
            />
          </div>
          <div class="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              class="inline-flex h-8.5 items-center gap-1.5 rounded-full bg-white px-3.5 text-[11.5px] font-medium text-ink-soft transition hover:bg-neutral-100 hover:text-ink focus-visible:bg-neutral-100 focus-visible:text-ink disabled:pointer-events-none disabled:opacity-45"
              :disabled="isStreaming"
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
              accept=".csv,.xlsx,.xls"
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
                'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors',
                isListening ? 'bg-rose-500 text-white' : 'text-muted hover:bg-neutral-200 hover:text-ink'
              ]"
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
              :disabled="!composer.trim() && !attachedFile"
              aria-label="ส่งคำถาม"
              @click="send(composer)"
            >
              <ArrowUp class="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <aside v-if="!historyCollapsed" class="hidden w-[332px] shrink-0 p-3 xl:block" aria-label="ประวัติการสนทนา">
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
  </div>
</template>