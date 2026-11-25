<script setup lang="ts">
import { computed } from 'vue'
import { Check, ChevronDown, X } from '@lucide/vue'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from 'reka-ui'
import { FOCUS_INDUSTRIES, getIndustryProfile } from '@/lib/industries'

const props = withDefaults(
  defineProps<{
    modelValue?: string | null
    disabled?: boolean
  }>(),
  { modelValue: null, disabled: false },
)

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const label = computed(() =>
  props.modelValue ? getIndustryProfile(props.modelValue).shortLabel : 'ยังไม่ระบุ',
)
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger as-child>
      <button
        type="button"
        :disabled="disabled"
        class="inline-flex h-7 max-w-[140px] items-center gap-1 rounded-full bg-white px-2.5 text-[11px] font-medium text-ink-soft ring-1 ring-black/[0.06] transition hover:bg-neutral-100 disabled:pointer-events-none disabled:opacity-50"
        :aria-label="`อุตสาหกรรม: ${label}`"
      >
        <span class="truncate">{{ label }}</span>
        <ChevronDown class="h-3 w-3 shrink-0 text-faint" aria-hidden="true" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent
        align="start"
        :side-offset="6"
        class="z-[70] max-h-80 w-56 overflow-y-auto rounded-2xl bg-white p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.06] focus:outline-none"
      >
        <DropdownMenuLabel class="px-3 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-muted">
          กำหนดอุตสาหกรรม
        </DropdownMenuLabel>
        <DropdownMenuItem
          v-for="industry in FOCUS_INDUSTRIES"
          :key="industry.id"
          class="flex cursor-pointer select-none items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-medium text-ink outline-none transition data-[highlighted]:bg-neutral-100"
          @select="emit('update:modelValue', industry.id)"
        >
          <span class="flex-1">{{ industry.label }}</span>
          <Check v-if="modelValue === industry.id" class="h-3.5 w-3.5 text-ink" aria-hidden="true" />
        </DropdownMenuItem>
        <DropdownMenuItem
          class="flex cursor-pointer select-none items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-medium text-muted outline-none transition data-[highlighted]:bg-neutral-100"
          @select="emit('update:modelValue', null)"
        >
          <X class="h-3.5 w-3.5" aria-hidden="true" />
          ไม่ระบุอุตสาหกรรม
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
