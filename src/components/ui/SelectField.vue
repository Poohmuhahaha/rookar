<script setup lang="ts">
import { computed, useId } from 'vue'
import {
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui'
import { Check, ChevronDown, ChevronUp } from '@lucide/vue'
import { cn } from '@/lib/cn'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    label?: string
    options: { value: string; label: string; disabled?: boolean }[]
    placeholder?: string
    error?: string
    hint?: string
    id?: string
    required?: boolean
    disabled?: boolean
    size?: 'md' | 'lg'
    surface?: boolean
  }>(),
  {
    required: false,
    disabled: false,
    size: 'md',
    surface: false,
  },
)

const model = defineModel<string>({ default: '' })
const autoId = useId()
const fieldId = computed(() => props.id ?? `select-${autoId}`)
const labelId = computed(() => `${fieldId.value}-label`)
const messageId = computed(() => `${fieldId.value}-message`)
</script>

<template>
  <div class="w-full">
    <label
      v-if="label"
      :id="labelId"
      :for="fieldId"
      class="mb-1.5 flex items-center gap-1 text-[13px] font-medium text-ink-soft"
    >
      {{ label }}
      <span v-if="required" class="text-danger" aria-hidden="true">*</span>
    </label>

    <SelectRoot v-model="model" :required="required" :disabled="disabled">
      <SelectTrigger
        :id="fieldId"
        :aria-labelledby="label ? labelId : undefined"
        :aria-invalid="Boolean(error)"
        :aria-describedby="error || hint ? messageId : undefined"
        :class="
          cn(
            'flex w-full items-center justify-between gap-2 rounded-lg text-left text-ink transition-all duration-200 focus:outline-none disabled:cursor-not-allowed disabled:bg-ink-100/60 disabled:text-muted data-[state=open]:bg-ink-100',
            size === 'lg' ? 'h-12 px-4 text-[15px]' : 'h-11 px-3.5 text-sm',
            error
              ? 'bg-danger-soft/40 focus:bg-danger-soft/60'
              : surface
                ? 'bg-white focus:bg-white data-[state=open]:bg-white'
                : 'bg-ink-50 focus:bg-ink-100',
          )
        "
      >
        <SelectValue
          :placeholder="placeholder"
          class="min-w-0 flex-1 truncate data-[placeholder]:text-faint"
        />
        <SelectIcon as-child>
          <ChevronDown class="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
        </SelectIcon>
      </SelectTrigger>

      <SelectPortal>
        <SelectContent
          position="popper"
          :side-offset="6"
          class="z-[80] max-h-72 min-w-[var(--reka-select-trigger-width)] overflow-hidden rounded-xl bg-white p-1 outline outline-1 outline-black/10"
        >
          <SelectScrollUpButton class="flex h-6 items-center justify-center text-muted">
            <ChevronUp class="h-4 w-4" aria-hidden="true" />
          </SelectScrollUpButton>
          <SelectViewport class="p-0">
            <SelectItem
              v-for="option in options"
              :key="option.value"
              :value="option.value"
              :disabled="option.disabled"
              class="relative flex w-full cursor-pointer select-none items-center rounded-lg py-2.5 pl-8 pr-3 text-sm text-ink outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-45 data-[highlighted]:bg-ink-100 data-[state=checked]:font-semibold"
            >
              <span class="absolute left-2 inline-flex h-4 w-4 items-center justify-center">
                <SelectItemIndicator>
                  <Check class="h-4 w-4" aria-hidden="true" />
                </SelectItemIndicator>
              </span>
              <SelectItemText>{{ option.label }}</SelectItemText>
            </SelectItem>
          </SelectViewport>
          <SelectScrollDownButton class="flex h-6 items-center justify-center text-muted">
            <ChevronDown class="h-4 w-4" aria-hidden="true" />
          </SelectScrollDownButton>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>

    <p
      v-if="error || hint"
      :id="messageId"
      :class="cn('mt-1.5 text-[12.5px]', error ? 'text-danger' : 'text-muted')"
    >
      {{ error || hint }}
    </p>
  </div>
</template>
