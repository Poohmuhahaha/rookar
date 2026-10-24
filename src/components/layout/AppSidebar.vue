<script setup lang="ts">
import { computed, type Ref } from 'vue'
import { Link, useRouterState } from '@tanstack/vue-router'
import {
  ChevronsUpDown,
  Database,
  LayoutDashboard,
  Sparkles,
  Upload,
  X,
} from '@lucide/vue'
import LogoMark from '@/components/brand/LogoMark.vue'
import SettingsMenu from '@/components/layout/SettingsMenu.vue'
import { getSession } from '@/lib/mockApi'

const props = withDefaults(defineProps<{ closable?: boolean }>(), {
  closable: false,
})

const emit = defineEmits<{ close: [] }>()

const session = getSession()

const businessName = computed(() => session?.business?.name ?? 'ธุรกิจของคุณ')

const pathname = useRouterState({ select: (state): string => state.location.pathname }) as Ref<string>

// ROOKAR Core Navigation (ตรงกับ Pages Listing & Feature Listing ใน Obsidian)
const mainNav = [
  { to: '/app', label: 'ภาพรวมธุรกิจ', icon: LayoutDashboard, exact: true },
  { to: '/app/assistant', label: 'ผู้ช่วย AI', icon: Sparkles, exact: false },
  { to: '/app/data-sources', label: 'แหล่งข้อมูล', icon: Database, exact: false },
  { to: '/app/import', label: 'นำเข้าข้อมูล', icon: Upload, exact: false },
]

function isActive(to: string, exact: boolean) {
  if (exact) return pathname.value === to
  return pathname.value.startsWith(to)
}
</script>

<template>
  <div class="flex h-full flex-col bg-white">
    <!-- Brand / Business Switcher Header -->
    <div class="flex items-center gap-1.5 p-3">
      <Link
        to="/setup"
        class="flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-black/[0.04]"
        aria-label="จัดการข้อมูลธุรกิจ"
        @click="emit('close')"
      >
        <LogoMark :size="32" class="shrink-0" />
        <span class="min-w-0 flex-1">
          <span class="block truncate text-[14.5px] font-bold tracking-tight text-ink">ROOKAR</span>
          <span class="block truncate text-[11.5px] font-medium text-muted">{{ businessName }}</span>
        </span>
        <ChevronsUpDown class="h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
      </Link>
      <button
        v-if="closable"
        type="button"
        class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-black/[0.04] hover:text-ink"
        aria-label="ปิดเมนู"
        @click="emit('close')"
      >
        <X class="h-4 w-4" aria-hidden="true" />
      </button>
    </div>

    <!-- Navigation List (Focus เป็นสีดำล้วน ไร้ Stroke ไร้ Shadow) -->
    <nav class="no-scrollbar flex-1 overflow-y-auto px-3 py-2" aria-label="เมนูหลัก">
      <ul class="space-y-1.5">
        <li v-for="item in mainNav" :key="item.to">
          <Link
            :to="item.to"
            :class="[
              'group flex h-11 items-center gap-3.5 rounded-full px-3 text-[13.5px] transition-all',
              isActive(item.to, item.exact)
                ? 'bg-black text-white font-semibold'
                : 'text-neutral-500 hover:bg-neutral-100 hover:text-black font-medium',
            ]"
            @click="emit('close')"
          >
            <component
              :is="item.icon"
              :class="[
                'h-4 w-4 shrink-0 transition-colors',
                isActive(item.to, item.exact) ? 'text-white' : 'text-neutral-400 group-hover:text-black',
              ]"
              aria-hidden="true"
            />
            <span class="flex-1 truncate">{{ item.label }}</span>
          </Link>
        </li>
      </ul>
    </nav>

    <!-- User Profile Card (SETO Style) -->
    <div class="p-3">
      <SettingsMenu variant="assistant" @close="emit('close')" />
    </div>
  </div>
</template>
