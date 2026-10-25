<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch, type Ref } from 'vue'
import { Outlet, useRouter, useRouterState } from '@tanstack/vue-router'
import { Menu, PanelLeftOpen } from '@lucide/vue'
import AppSidebar from './AppSidebar.vue'
import AppSheet from '@/components/ui/AppSheet.vue'
import { getSession } from '@/lib/mockApi'
import {
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
  persistSidebarWidth,
  setSidebarWidth,
  sidebarCollapsed,
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

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  stopResize?.()
  window.removeEventListener('keydown', handleKeyDown)
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

    <div class="flex h-full w-full overflow-hidden bg-white">
      <!-- Unified Consistent Sidebar across all routes (Silky Smooth Negative-Margin Slide) -->
      <aside
        :class="[
          'relative hidden h-full shrink-0 bg-white border-r border-black/[0.06] lg:block',
          !isResizing ? 'transition-[margin] duration-300 ease-in-out will-change-[margin-left]' : '',
        ]"
        :style="{
          width: `${sidebarWidth}px`,
          marginLeft: sidebarCollapsed ? `-${sidebarWidth}px` : '0px',
        }"
      >
        <AppSidebar />
        <div
          class="absolute inset-y-0 -right-1 z-10 hidden w-2 cursor-col-resize touch-none lg:block"
          role="separator"
          aria-orientation="vertical"
          aria-label="ปรับความกว้างเมนู"
          :aria-valuemin="SIDEBAR_MIN_WIDTH"
          :aria-valuemax="SIDEBAR_MAX_WIDTH"
          :aria-valuenow="sidebarWidth"
          tabindex="0"
          @pointerdown="startSidebarResize"
          @keydown.left.prevent="nudgeSidebar(-16)"
          @keydown.right.prevent="nudgeSidebar(16)"
        ></div>
      </aside>

      <!-- Main Content Area -->
      <main
        id="main-content"
        :class="[
          'relative min-w-0 flex-1 overflow-hidden h-full',
          isAssistant ? '' : 'overflow-y-auto bg-white p-4 sm:p-6 lg:p-8',
        ]"
      >
        <!-- Desktop Sidebar Expand Toggle (When collapsed, smoothly fades in) -->
        <button
          type="button"
          :class="[
            'fixed left-3.5 top-3.5 z-30 hidden h-9 w-9 items-center justify-center rounded-xl bg-white border border-black/10 text-muted shadow-xs transition-all duration-300 hover:bg-neutral-50 hover:text-ink lg:inline-flex',
            sidebarCollapsed
              ? 'opacity-100 pointer-events-auto scale-100 delay-150'
              : 'opacity-0 pointer-events-none scale-90 delay-0',
          ]"
          aria-label="ขยายแถบเมนู (Ctrl+\)"
          title="ขยายแถบเมนู (Ctrl+\)"
          @click="toggleSidebar"
        >
          <PanelLeftOpen class="h-4 w-4" aria-hidden="true" />
        </button>

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
