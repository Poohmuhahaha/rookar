<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Check,
  CheckSquare,
  Copy,
  FileSpreadsheet,
  ShieldAlert,
  ThumbsDown,
  ThumbsUp,
} from '@lucide/vue'
import { formatTime } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { ChatMessage } from '@/types'

const props = defineProps<{
  message: ChatMessage
}>()

const emit = defineEmits<{
  feedback: [value: 'up' | 'down' | null]
  copy: [text: string]
}>()

const isAssistant = computed(() => props.message.role === 'assistant')
const hasContent = computed(() => props.message.content.trim().length > 0)
const citations = computed(() => props.message.citations ?? [])
const showActionPlan = ref(false)
const checklist = ref<{ id: string; text: string; done: boolean }[]>([])

const blocks = computed(() => {
  const result: { type: 'paragraph' | 'list'; text?: string; items?: string[] }[] = []
  let list: string[] | null = null

  for (const rawLine of props.message.content.split('\n')) {
    const line = rawLine.trim()
    if (!line) {
      list = null
      continue
    }
    if (/^[•\-]\s*/.test(line)) {
      if (!list) {
        list = []
        result.push({ type: 'list', items: list })
      }
      list.push(line.replace(/^[•\-]\s*/, ''))
      continue
    }
    list = null
    result.push({ type: 'paragraph', text: line })
  }

  return result
})

const hasListItems = computed(() =>
  blocks.value.some((b) => b.type === 'list' && b.items && b.items.length > 0),
)

function toggleActionPlan() {
  if (checklist.value.length === 0) {
    const items: { id: string; text: string; done: boolean }[] = []
    let idx = 0
    for (const b of blocks.value) {
      if (b.type === 'list' && b.items) {
        for (const item of b.items) {
          items.push({ id: `item_${idx++}`, text: item, done: false })
        }
      }
    }
    checklist.value = items
  }
  showActionPlan.value = !showActionPlan.value
}

function toggleFeedback(value: 'up' | 'down') {
  emit('feedback', props.message.feedback === value ? null : value)
}
</script>

<template>
  <div :class="cn('group flex gap-3', !isAssistant ? 'justify-end' : 'items-start')">
    <div
      v-if="isAssistant"
      class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100"
    >
      <img src="/ai-avatar.png" alt="ROOKAR AI" class="h-full w-full object-cover" />
    </div>
    <div :class="cn('min-w-0', isAssistant ? 'flex-1' : 'max-w-[85%] sm:max-w-[75%]')">
      <div
        :class="
          cn(
            'text-[13.5px] leading-[1.85] sm:text-[14px]',
            isAssistant
              ? 'text-ink-soft'
              : 'rounded-[20px] bg-ink-100 px-4 py-2.5 text-ink',
            message.error && 'rounded-xl bg-danger-soft px-4 py-3 text-danger',
          )
        "
      >
        <template v-if="hasContent">
          <template v-for="(block, index) in blocks" :key="index">
            <p v-if="block.type === 'paragraph'" class="break-words">{{ block.text }}</p>
            <ul v-else class="list-disc space-y-1.5 pl-5 marker:text-muted">
              <li v-for="item in block.items" :key="item" class="break-words">{{ item }}</li>
            </ul>
          </template>
          <span
            v-if="message.streaming"
            class="ml-0.5 inline-block h-3.5 w-1 animate-pulse rounded-[1px] bg-brand-500 align-[-1px]"
            aria-hidden="true"
          />
        </template>
        <div v-else-if="message.streaming" class="flex items-center gap-1 py-1" aria-label="AI กำลังพิมพ์">
          <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500 [animation-delay:0ms]" />
          <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500 [animation-delay:120ms]" />
          <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500 [animation-delay:240ms]" />
        </div>

        <div v-if="isAssistant && citations.length" class="mt-4">
          <p class="flex items-center gap-1 text-[11px] font-medium text-muted">
            <FileSpreadsheet class="h-3.5 w-3.5" aria-hidden="true" />
            แหล่งข้อมูลอ้างอิง
          </p>
          <div class="mt-2 grid gap-2 sm:grid-cols-2">
            <div v-for="citation in citations" :key="citation.id" class="rounded-2xl bg-neutral-100 px-3.5 py-2.5">
              <div class="flex items-start justify-between gap-2">
                <p class="text-[11.5px] font-medium text-ink">{{ citation.title }}</p>
                <span class="tabular shrink-0 rounded-full bg-black px-2 py-0.5 text-[11px] font-semibold text-white">{{ citation.value }}</span>
              </div>
              <p class="mt-0.5 truncate text-[10.5px] text-muted">{{ citation.period }} · {{ citation.source }}</p>
            </div>
          </div>
        </div>

        <!-- Action Plan Checklist (Multi-output for next actions) -->
        <div v-if="showActionPlan && checklist.length" class="mt-4 rounded-2xl bg-neutral-100 p-4">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <CheckSquare class="h-4 w-4 text-black" />
              <span class="text-xs font-bold text-ink">Action Plan ปฏิบัติการ (Next Actions)</span>
            </div>
            <span class="rounded-full bg-white px-2 py-0.5 text-[10.5px] font-semibold text-neutral-700">
              {{ checklist.filter(c => c.done).length }}/{{ checklist.length }} ข้อเสร็จแล้ว
            </span>
          </div>
          <div class="space-y-2">
            <label
              v-for="item in checklist"
              :key="item.id"
              class="flex items-start gap-2.5 rounded-xl bg-white p-2.5 text-xs cursor-pointer hover:bg-neutral-50 transition"
            >
              <input
                type="checkbox"
                v-model="item.done"
                class="mt-0.5 h-3.5 w-3.5 rounded accent-black cursor-pointer"
              />
              <span :class="['flex-1 leading-relaxed', item.done ? 'line-through text-muted' : 'text-ink']">
                {{ item.text }}
              </span>
            </label>
          </div>
        </div>

        <!-- AI Transparency & Trust Policy Disclaimer -->
        <p v-if="isAssistant && !message.streaming && hasContent" class="mt-3.5 text-[10.5px] text-muted flex items-center gap-1.5 border-t border-neutral-100 pt-2">
          <ShieldAlert class="h-3 w-3 shrink-0 text-neutral-400" />
          <span>ROOKAR Trust Policy: ข้อมูลประเมินเบื้องต้นจากไฟล์ร้านและสถิติทางการไทย (สศช./ธปท.) เพื่อสนับสนุนการตัดสินใจ</span>
        </p>
      </div>

      <div
        :class="
          cn(
            'mt-1 flex h-7 items-center gap-1 text-[11px] text-muted transition-opacity duration-150',
            isAssistant ? 'justify-start' : 'justify-end',
            'opacity-100 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:focus-within:opacity-100',
          )
        "
      >
        <span>{{ formatTime(message.createdAt) }}</span>
        <template v-if="isAssistant && !message.streaming && hasContent">
          <span class="mx-0.5 text-ink-200">·</span>
          <!-- Multi-output button: แปลงเป็น Action Plan -->
          <button
            v-if="hasListItems"
            type="button"
            :class="[
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold transition',
              showActionPlan ? 'bg-black text-white' : 'bg-neutral-100 text-ink hover:bg-neutral-200'
            ]"
            aria-label="แปลงเป็น Action Plan"
            @click="toggleActionPlan"
          >
            <CheckSquare class="h-3 w-3" />
            <span>{{ showActionPlan ? 'ซ่อน Action Plan' : 'แปลงเป็น Action Plan' }}</span>
          </button>
          <button
            type="button"
            class="inline-flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-brand-50 hover:text-brand-700 focus-visible:bg-brand-50 focus-visible:text-brand-700"
            aria-label="คัดลอกคำตอบ"
            @click="emit('copy', message.content)"
          >
            <Copy class="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            :class="
              cn(
                'inline-flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-brand-50 hover:text-brand-700 focus-visible:bg-brand-50 focus-visible:text-brand-700',
                message.feedback === 'up' && 'bg-brand-50 text-brand-700',
              )
            "
            aria-label="คำตอบนี้มีประโยชน์"
            :aria-pressed="message.feedback === 'up'"
            @click="toggleFeedback('up')"
          >
            <ThumbsUp class="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            :class="
              cn(
                'inline-flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-danger-soft hover:text-danger focus-visible:bg-danger-soft focus-visible:text-danger',
                message.feedback === 'down' && 'bg-danger-soft text-danger',
              )
            "
            aria-label="คำตอบนี้ยังไม่ถูกต้อง"
            :aria-pressed="message.feedback === 'down'"
            @click="toggleFeedback('down')"
          >
            <ThumbsDown class="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <span v-if="message.feedback" class="ml-0.5 inline-flex items-center gap-0.5 text-[11px] text-brand-700" role="status">
            <Check class="h-3 w-3" aria-hidden="true" />
            บันทึกแล้ว
          </span>
        </template>
      </div>
    </div>
  </div>
</template>
