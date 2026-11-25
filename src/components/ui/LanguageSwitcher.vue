<script setup lang="ts">
import { computed } from 'vue'
import { Check, ChevronDown, Globe2 } from '@lucide/vue'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from 'reka-ui'
import { locale, setLocale, t, type Locale } from '@/lib/i18n'
import { useToast } from '@/lib/toast'

withDefaults(defineProps<{ iconOnly?: boolean }>(), { iconOnly: false })

const toast = useToast()

const options: { value: Locale; label: string }[] = [
  { value: 'th', label: 'ภาษาไทย' },
  { value: 'en', label: 'English' },
]

const short = computed(() => (locale.value === 'th' ? 'ไทย' : 'EN'))

function selectLanguage(value: Locale) {
  if (locale.value === value) return
  setLocale(value)
  toast.success(t('lang.changedTitle'), t('lang.changedDesc'))
}
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger as-child>
      <button
        type="button"
        :class="[
          'inline-flex h-9 items-center rounded-full bg-surface text-[12px] font-medium text-ink-soft transition hover:bg-neutral-200 hover:text-ink focus-visible:bg-neutral-200 focus-visible:outline-none',
          iconOnly ? 'w-9 justify-center' : 'gap-1.5 px-3',
        ]"
        :aria-label="locale === 'th' ? 'เปลี่ยนภาษา' : 'Change language'"
        :title="locale === 'th' ? 'เปลี่ยนภาษา' : 'Change language'"
      >
        <Globe2 class="h-4 w-4 text-muted" aria-hidden="true" />
        <template v-if="!iconOnly">
          <span>{{ short }}</span>
          <ChevronDown class="h-3.5 w-3.5 text-faint" aria-hidden="true" />
        </template>
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent
        side="bottom"
        align="end"
        :side-offset="8"
        class="z-[70] min-w-[170px] rounded-2xl bg-surface p-1.5 shadow-float focus:outline-none"
      >
        <DropdownMenuItem
          v-for="option in options"
          :key="option.value"
          class="flex cursor-pointer select-none items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-medium text-ink outline-none transition data-[highlighted]:bg-neutral-200/70"
          @select="selectLanguage(option.value)"
        >
          <span class="flex-1">{{ option.label }}</span>
          <Check
            v-if="locale === option.value"
            class="h-3.5 w-3.5 text-brand-600"
            aria-hidden="true"
          />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
