<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch, type Ref } from 'vue'
import { Outlet, useRouter, useRouterState } from '@tanstack/vue-router'
import { ChevronLeft, ChevronRight, Menu } from '@lucide/vue'
import AppSidebar from './AppSidebar.vue'
import AppSheet from '@/components/ui/AppSheet.vue'
import { getSession } from '@/lib/mockApi'
import { hydrateAgents } from '@/lib/agentVault'
import {
  persistSidebarWidth,
  setSidebarWidth,
  sidebarCollapsed,
  sidebarMaxWidth,
  sidebarMinWidth,
  sidebarWidth,
  toggleSidebar,
} from '@/lib/shell'

const router = useRouter()
const session = getSession()
const mobileOpen = ref(false)
const pathname = useRouterState({ select: (state): string => state.location.pathname }) as Ref<string>
const isAssistant = computed<boolean>(() => pathname.value === '/app/assistant')
const isResizing = ref(false)
let stopResize: (() => void) | null = null

function startSidebarResize(event: PointerEvent) {
  if (event.button !== 0) return
  event.preventDefault()
  isResizing.value = true
  const startX = event.clientX
  const startWidth = sidebarWidth.value
  const onMove = (moveEvent: PointerEvent) => {
    setSidebarWidth(startWidth + moveEvent.clientX - startX)
  }
  const stop = () => {
    persistSidebarWidth()
    isResizing.value = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', stop)
    stopResize = null
  }
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', stop)
  stopResize = stop
}

function nudgeSidebar(delta: number) {
  setSidebarWidth(sidebarWidth.value + delta)
  persistSidebarWidth()
}

function handleKeyDown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && (event.key === '\\' || event.key === 'b')) {
    event.preventDefault()
    toggleSidebar()
  }
}

function ensureSidebarWidth() {
  const min = sidebarMinWidth()
  if (sidebarWidth.value < min) setSidebarWidth(min)
}

onMounted(() => {
  ensureSidebarWidth()
  if (session) void hydrateAgents()
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('resize', ensureSidebarWidth)
})

onUnmounted(() => {
  stopResize?.()
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('resize', ensureSidebarWidth)
})

watch(pathname, () => {
  mobileOpen.value = false
})
</script>

<template>
  <div class="h-dvh w-full overflow-hidden bg-white">
    <a
      href="#main-content"
      class="sr-only z-[80] rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
    >
      ข้ามไปยังเนื้อหา
    </a>

    <div class="relative flex h-full w-full overflow-hidden bg-white lg:gap-12">
      <!-- Unified Consistent Sidebar across all routes (Silky Smooth Negative-Margin Slide) -->
      <aside
        :class="[
          'group/aside relative hidden h-full shrink-0 overflow-hidden bg-white lg:block',
          !isResizing
            ? sidebarCollapsed
              ? 'transition-[width] duration-300 ease-in-out will-change-[width]'
              : 'transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[width]'
            : '',
        ]"
        :style="{
          width: sidebarCollapsed ? '72px' : `${sidebarWidth}px`,
        }"
      >
        <AppSidebar />
        <div
          v-if="!sidebarCollapsed"
          class="group/resize absolute inset-y-0 -right-2 z-20 hidden w-4 cursor-col-resize touch-none items-center justify-center lg:flex"
          role="separator"
          aria-orientation="vertical"
          aria-label="ปรับความกว้างเมนู"
          title="ลากเพื่อปรับความกว้าง Sidebar"
          :aria-valuemin="sidebarMinWidth()"
          :aria-valuemax="sidebarMaxWidth()"
          :aria-valuenow="sidebarWidth"
          tabindex="0"
          @pointerdown="startSidebarResize"
          @keydown.left.prevent="nudgeSidebar(-16)"
          @keydown.right.prevent="nudgeSidebar(16)"
        >
          <span
            class="h-14 w-1 rounded-full bg-neutral-300/70 opacity-50 transition-all duration-200 group-hover/aside:opacity-100 group-hover/resize:bg-neutral-400 group-hover/resize:opacity-100"
            aria-hidden="true"
          />
        </div>
      </aside>

      <button
        type="button"
        :class="[
          'absolute top-4 z-[60] hidden h-16 w-8 -translate-x-px cursor-pointer items-center justify-center rounded-r-2xl border border-black/10! bg-white text-neutral-400 shadow-md lg:flex',
          !isResizing
            ? sidebarCollapsed
              ? 'transition-[left] duration-300 ease-in-out'
              : 'transition-[left] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]'
            : '',
        ]"
        :style="{ left: sidebarCollapsed ? '72px' : `${sidebarWidth}px` }"
        :aria-label="sidebarCollapsed ? 'ขยายแถบเมนู (Ctrl+\)' : 'ย่อแถบเมนู (Ctrl+\)'"
        :title="sidebarCollapsed ? 'ขยายแถบเมนู (Ctrl+\)' : 'ย่อแถบเมนู (Ctrl+\)'"
        @click="toggleSidebar"
      >
        <ChevronRight v-if="sidebarCollapsed" class="h-4 w-4 transition-transform duration-300 ease-out" aria-hidden="true" />
        <ChevronLeft v-else class="h-4 w-4 transition-transform duration-300 ease-out" aria-hidden="true" />
      </button>

      <!-- Main Content Area -->
      <main
        id="main-content"
        :class="[
          'relative min-w-0 flex-1 overflow-hidden h-full',
          isAssistant ? '' : 'overflow-y-auto bg-white p-4 sm:p-6 lg:px-8 lg:py-5',
        ]"
      >
        <Outlet />
      </main>
    </div>

    <!-- Mobile Drawer Toggle -->
    <button
      type="button"
      class="fixed left-3 top-3 z-40 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/90 text-ink-soft backdrop-blur transition hover:bg-ink-100 lg:hidden"
      aria-label="เปิดเมนู"
      @click="mobileOpen = true"
    >
      <Menu class="h-5 w-5" aria-hidden="true" />
    </button>

    <!-- Mobile Drawer -->
    <AppSheet
      :open="mobileOpen"
      title="เมนูหลัก"
      side="left"
      hide-header
      :padded="false"
      width="w-[280px]"
      @update:open="mobileOpen = $event"
    >
      <AppSidebar closable @close="mobileOpen = false" />
    </AppSheet>
  </div>
</template>
