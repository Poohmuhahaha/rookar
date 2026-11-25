<script setup lang="ts">
import { computed, ref } from 'vue'
import { Image as ImageIcon, PanelRightClose, Plus, Search, Trash2 } from '@lucide/vue'
import LogoMark from '@/components/brand/LogoMark.vue'
import AgentAvatar from '@/components/ui/AgentAvatar.vue'
import { conversationAgents } from '@/lib/conversationAgents'
import { cn } from '@/lib/cn'
import { getSession } from '@/lib/mockApi'
import { shortTimeAgo } from '@/lib/format'
import type { Conversation } from '@/types'

const props = withDefaults(
  defineProps<{
    conversations: Conversation[]
    activeId: string | null
    loading?: boolean
    closable?: boolean
  }>(),
  { loading: false, closable: false },
)

const emit = defineEmits<{
  select: [conversation: Conversation]
  newChat: []
  close: []
  delete: [conversation: Conversation]
}>()

const session = getSession()
const initials = computed(() => session?.user.initials ?? 'RK')
const avatarUrl = computed(() => session?.user.avatarUrl ?? '/avatar.jpg')
const search = ref('')

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return props.conversations
  return props.conversations.filter(
    (conversation) =>
      conversation.title.toLowerCase().includes(query) ||
      conversation.preview.toLowerCase().includes(query),
  )
})

const emptyMessage = computed(() =>
  search.value.trim() ? 'ไม่พบบทสนทนาที่ค้นหา' : 'ยังไม่มีบทสนทนา',
)

function agentsFor(conversation: Conversation) {
  return conversationAgents(conversation)
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-col bg-surface">
    <header class="flex items-center justify-between gap-2 px-4 pb-3 pt-4">
      <h2 class="truncate text-[15px] font-bold tracking-tight text-ink">ประวัติการสนทนา</h2>
      <div class="flex items-center gap-1">
        <button
          type="button"
          class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-ink-50/80 text-muted transition hover:bg-ink-100 hover:text-ink"
          aria-label="สลับมุมมองแกลเลอรี"
          title="สลับมุมมองแกลเลอรี"
        >
          <ImageIcon class="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <button
          v-if="closable"
          type="button"
          class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-50 text-muted transition hover:bg-ink-100 hover:text-ink"
          aria-label="ซ่อนประวัติแชท"
          @click="emit('close')"
        >
          <PanelRightClose class="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </header>

    <div class="px-3 pb-2">
      <div class="relative">
        <Search class="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" aria-hidden="true" />
        <input
          v-model="search"
          type="text"
          inputmode="search"
          placeholder="ค้นหาบทสนทนา..."
          class="h-9 w-full rounded-full bg-white pl-9 pr-3 text-[12px] text-ink placeholder:text-muted/60 focus:outline-none"
          aria-label="ค้นหาบทสนทนา"
        />
      </div>
    </div>

    <nav class="no-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-2" aria-label="ประวัติการสนทนา">
      <div v-if="loading" class="space-y-3 py-2">
        <div v-for="index in 4" :key="index" class="skeleton h-16 rounded-2xl" />
      </div>

      <p v-else-if="!filtered.length" class="px-2 py-8 text-center text-[12px] text-muted">
        {{ emptyMessage }}
      </p>

      <ul v-else class="space-y-1">
        <li v-for="conversation in filtered" :key="conversation.id" class="group/conversation relative">
          <button
            type="button"
            :class="
              cn(
                'flex w-full items-start gap-2.5 rounded-2xl p-2.5 pr-9 text-left transition',
                activeId === conversation.id ? 'bg-white text-ink' : 'text-ink-soft hover:bg-white/60 hover:text-ink',
              )
            "
            :aria-current="activeId === conversation.id ? 'true' : undefined"
            @click="emit('select', conversation)"
          >
            <span class="min-w-0 flex-1">
              <span class="block truncate text-[12.5px] font-semibold text-ink">{{ conversation.title }}</span>
              <span class="mt-0.5 block truncate text-[11px] font-normal text-muted">
                {{ conversation.preview || 'ยังไม่มีข้อความ' }}
              </span>

              <!-- Visual Thumbnail Preview Card -->
              <div
                v-if="conversation.thumbnail"
                class="my-2.5 overflow-hidden rounded-[14px] bg-white"
              >
                <img
                  :src="conversation.thumbnail"
                  :alt="conversation.title"
                  class="h-28 w-full object-cover transition-transform duration-300 hover:scale-105"
                  loading="lazy"
                />
              </div>

              <span class="mt-2.5 flex items-center justify-between gap-2">
                <span class="flex items-center -space-x-1.5">
                  <template v-if="agentsFor(conversation).length">
                    <AgentAvatar
                      v-for="agent in agentsFor(conversation).slice(0, 4)"
                      :key="agent.name"
                      :name="agent.name"
                      :color="agent.color"
                      size="sm"
                    />
                    <span
                      v-if="agentsFor(conversation).length > 4"
                      class="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-800 text-[9.5px] font-bold text-white ring-2 ring-white"
                    >
                      +{{ agentsFor(conversation).length - 4 }}
                    </span>
                    <span class="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-neutral-200 ring-2 ring-white">
                      <img :src="avatarUrl" alt="User" class="h-full w-full object-cover" />
                    </span>
                  </template>
                  <template v-else-if="conversation.avatars && conversation.avatars.length">
                    <span
                      v-for="(av, idx) in conversation.avatars"
                      :key="idx"
                      :class="[
                        'flex h-7 w-7 items-center justify-center rounded-full text-[10.5px] font-bold text-white',
                        idx === 0 ? 'bg-[#d97706]' : idx === 1 ? 'bg-[#475569]' : 'bg-black',
                      ]"
                    >
                      {{ av }}
                    </span>
                  </template>
                  <template v-else>
                    <span class="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-neutral-100">
                      <img src="/ai-avatar.png" alt="ROOKAR AI" class="h-full w-full object-cover" />
                    </span>
                    <span class="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-neutral-200">
                      <img :src="avatarUrl" alt="User" class="h-full w-full object-cover" />
                    </span>
                  </template>
                </span>
                <span class="text-[11px] font-medium text-muted">
                  {{ shortTimeAgo(conversation.updatedAt) }}
                </span>
              </span>
            </span>
          </button>
          <button
            type="button"
            class="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-lg text-faint opacity-0 transition hover:bg-danger-soft hover:text-danger focus-visible:opacity-100 group-hover/conversation:opacity-100"
            :aria-label="`ลบแชท ${conversation.title}`"
            title="ลบแชท"
            @click.stop="emit('delete', conversation)"
          >
            <Trash2 class="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </li>
      </ul>
    </nav>

    <div class="p-3 pt-2">
      <button
        type="button"
        class="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-ink text-[12.5px] font-semibold text-white transition hover:bg-black focus-visible:outline-none"
        @click="emit('newChat')"
      >
        <Plus class="h-4 w-4" aria-hidden="true" />
        เริ่มแชทใหม่
      </button>
    </div>
  </div>
</template>