<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from '@tanstack/vue-router'
import { Settings } from '@lucide/vue'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher.vue'
import { getSession } from '@/lib/mockApi'
import { profileAvatar } from '@/lib/profile'

const props = withDefaults(defineProps<{ compact?: boolean }>(), {
  compact: false,
})

const emit = defineEmits<{ close: [] }>()

const router = useRouter()
const session = getSession()
const plan = computed(() => session?.plan ?? 'Pro')
const name = computed(() => session?.user.name ?? 'ภีม ธีรภัทร')
const emailPrefix = computed(() => session?.user.email?.split('@')[0] ?? 'demo')

function goSettings() {
  emit('close')
  void router.navigate({ to: '/app/settings' })
}
</script>

<template>
  <div
    v-if="!props.compact"
    class="group w-full rounded-[24px] bg-[#e4e4e7] p-2"
  >
    <div class="flex items-center gap-1.5">
      <button
        type="button"
        class="flex min-w-0 flex-1 items-center gap-2.5 text-left focus-visible:outline-none"
        aria-label="เปิดหน้าตั้งค่าและโปรไฟล์"
        @click="goSettings"
      >
        <span class="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200">
          <img :src="profileAvatar" :alt="name" class="h-full w-full object-cover" />
          <span class="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-black ring-2 ring-white" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="flex items-center gap-1.5">
            <span class="truncate text-[13px] font-bold text-ink">{{ name }}</span>
            <span class="rounded-full bg-black px-1.5 py-0.5 text-[9.5px] font-semibold text-white">
              {{ plan }}
            </span>
          </span>
          <span class="block truncate text-[11px] text-muted">@{{ emailPrefix }}</span>
        </span>
      </button>
      <button
        type="button"
        class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-white hover:text-ink"
        aria-label="ตั้งค่า"
        title="ตั้งค่า"
        @click="goSettings"
      >
        <Settings class="h-4 w-4" aria-hidden="true" />
      </button>
      <LanguageSwitcher icon-only />
    </div>
  </div>

  <div v-else class="flex flex-col items-center gap-1">
    <button
      type="button"
      class="flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-none"
      aria-label="เปิดหน้าตั้งค่าและโปรไฟล์"
      title="เปิดหน้าตั้งค่าและโปรไฟล์"
      @click="goSettings"
    >
      <span class="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200">
        <img :src="profileAvatar" :alt="name" class="h-full w-full object-cover" />
        <span class="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-black ring-2 ring-white" />
      </span>
    </button>
    <LanguageSwitcher icon-only />
  </div>
</template>
