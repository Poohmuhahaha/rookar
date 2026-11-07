<script setup lang="ts">
import { computed, onUnmounted, ref, watch, type Ref } from 'vue'
import { Link, useRouterState } from '@tanstack/vue-router'
import {
  ChevronsUpDown,
  Database,
  Globe2,
  LayoutDashboard,
  Sparkles,
  X,
} from '@lucide/vue'
import LogoMark from '@/components/brand/LogoMark.vue'
import ProfileCardButton from '@/components/layout/ProfileCardButton.vue'
import { getSession } from '@/lib/mockApi'
import { sidebarCollapsed } from '@/lib/shell'

const props = withDefaults(defineProps<{ closable?: boolean }>(), {
  closable: false,
})

const emit = defineEmits<{ close: [] }>()

const session = getSession()

const compact = ref(!props.closable && sidebarCollapsed.value)
let compactTimer: ReturnType<typeof setTimeout> | null = null
let ready = false

watch(
  [() => props.closable, sidebarCollapsed],
  ([closable, collapsed]) => {
    if (compactTimer) {
      clearTimeout(compactTimer)
      compactTimer = null
    }
    if (!ready) {
      ready = true
      compact.value = !closable && collapsed
      return
    }
    if (closable || !collapsed) {
      compact.value = false
      return
    }
    compactTimer = setTimeout(() => {
      compact.value = true
      compactTimer = null
    }, 240)
  },
  { immediate: true },
)

onUnmounted(() => {
  if (compactTimer) clearTimeout(compactTimer)
})

const businessName = computed(() => session?.business?.name ?? 'ธุรกิจของคุณ')

const pathname = useRouterState({ select: (state): string => state.location.pathname }) as Ref<string>

// ROOKAR Core Navigation (ตรงกับ Pages Listing & Feature Listing ใน Obsidian)
const mainNav = [
  { to: '/app', label: 'ภาพรวมธุรกิจ', icon: LayoutDashboard, exact: true },
  { to: '/app/industry', label: 'เศรษฐกิจ & อุตสาหกรรม', icon: Globe2, exact: false },
  { to: '/app/assistant', label: 'ผู้ช่วย AI', icon: Sparkles, exact: false },
  { to: '/app/data-sources', label: 'แหล่งข้อมูล', icon: Database, exact: false },
]

function isActive(to: string, exact: boolean) {
  if (to === '/app/data-sources') {
    return pathname.value.startsWith('/app/data-sources') || pathname.value.startsWith('/app/import')
  }
  if (exact) return pathname.value === to
  return pathname.value.startsWith(to)
}
</script>

<template>
  <div class="flex h-full flex-col border-r border-neutral-300! bg-white">
    <!-- Brand / Business Switcher Header -->
    <div class="flex h-[72px] shrink-0 items-center gap-1.5 p-3">
      <Link
        to="/setup"
        class="relative flex h-12 min-w-0 flex-1 items-center rounded-2xl"
        aria-label="จัดการข้อมูลธุรกิจ"
        title="ROOKAR"
        @click="emit('close')"
      >
        <LogoMark :size="40" class="absolute left-1 top-1/2 shrink-0 -translate-y-1/2" />
        <span v-if="!compact" class="min-w-0 flex-1 pl-14">
          <span class="block truncate text-[14.5px] font-bold tracking-tight text-ink">ROOKAR</span>
          <span class="block truncate text-[11.5px] font-medium text-muted">{{ businessName }}</span>
        </span>
        <ChevronsUpDown v-if="!compact" class="ml-2 h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
      </Link>

      <!-- Mobile Close Button -->
      <button
        v-if="closable"
        type="button"
        class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted"
        aria-label="ปิดเมนู"
        @click="emit('close')"
      >
        <X class="h-4 w-4" aria-hidden="true" />
      </button>
    </div>

    <!-- Navigation List -->
    <nav class="no-scrollbar flex-1 overflow-y-auto px-3 py-2" aria-label="เมนูหลัก">
      <ul class="space-y-1.5">
        <li v-for="item in mainNav" :key="item.to">
          <Link
            :to="item.to"
            :title="compact ? item.label : undefined"
            :aria-label="item.label"
            :class="[
              'group relative flex h-11 w-full items-center rounded-2xl text-[13.5px]',
              isActive(item.to, item.exact)
                ? 'bg-black text-white font-semibold'
                : 'text-neutral-500 font-medium',
            ]"
            @click="emit('close')"
          >
            <component
              :is="item.icon"
              :class="[
                'absolute left-4 top-1/2 h-4 w-4 shrink-0 -translate-y-1/2 transition-colors',
                isActive(item.to, item.exact) ? 'text-white' : 'text-neutral-400',
              ]"
              aria-hidden="true"
            />
            <span v-if="!compact" class="truncate pl-[46px] pr-3">{{ item.label }}</span>
          </Link>
        </li>
      </ul>
    </nav>

    <!-- User Profile Card -->
    <div :class="compact ? 'flex flex-col items-center border-t border-black/[0.06] p-3 pb-3.5' : 'border-t border-black/[0.06] p-2'">
      <ProfileCardButton :compact="compact" @close="emit('close')" />
    </div>
  </div>
</template>
