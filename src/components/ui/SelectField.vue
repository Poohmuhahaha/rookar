<script setup lang="ts">
import { computed, useId } from 'vue'
import { ChevronDown } from '@lucide/vue'
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
  }>(),
  {
    required: false,
    disabled: false,
    size: 'md',
  },
)

const model = defineModel<string>({ default: '' })
const autoId = useId()
const fieldId = computed(() => props.id ?? `select-${autoId}`)
const messageId = computed(() => `${fieldId.value}-message`)
</script>

<template>
  <div class="w-full">
    <label
      v-if="label"
      :for="fieldId"
      class="mb-1.5 flex items-center gap-1 text-[13px] font-medium text-ink-soft"
    >
      {{ label }}
      <span v-if="required" class="text-danger" aria-hidden="true">*</span>
    </label>

    <div class="relative">
      <select
        :id="fieldId"
        v-model="model"
        :required="required"
        :disabled="disabled"
        :aria-invalid="Boolean(error)"
        :aria-describedby="error || hint ? messageId : undefined"
        :class="
          cn(
            'w-full appearance-none rounded-lg text-ink transition-all duration-200 focus:outline-none disabled:bg-ink-100/60 disabled:text-muted',
            size === 'lg' ? 'h-12 px-4 pr-10 text-[15px]' : 'h-11 px-3.5 pr-10 text-sm',
            error
              ? 'bg-danger-soft/40 focus:bg-danger-soft/60'
              : 'bg-ink-50 focus:bg-ink-100',
          )
        "
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
          :disabled="option.disabled"
        >
          {{ option.label }}
        </option>
      </select>
      <ChevronDown
        class="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
    </div>

    <p
      v-if="error || hint"
      :id="messageId"
      :class="cn('mt-1.5 text-[12.5px]', error ? 'text-danger' : 'text-muted')"
    >
      {{ error || hint }}
    </p>
  </div>
</template>
