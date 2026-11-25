<script setup lang="ts">
import { computed, useId } from 'vue'
import { Check } from '@lucide/vue'

const props = defineProps<{
  label?: string
  description?: string
  error?: string
  disabled?: boolean
  id?: string
}>()

const model = defineModel<boolean>({ default: false })
const autoId = useId()
const fieldId = computed(() => props.id ?? `checkbox-${autoId}`)
</script>

<template>
  <div class="w-full">
    <label
      :for="fieldId"
      class="group flex cursor-pointer items-start gap-2.5"
      :class="disabled && 'cursor-not-allowed opacity-60'"
    >
      <span class="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
        <input
          :id="fieldId"
          v-model="model"
          type="checkbox"
          :disabled="disabled"
          class="peer sr-only"
          :aria-invalid="Boolean(error)"
        />
        <span
          class="flex h-5 w-5 items-center justify-center rounded-[7px] bg-ink-100 transition-all duration-150 group-hover:bg-brand-50 peer-focus-visible:bg-brand-100 peer-checked:bg-brand-700"
        >
          <Check v-if="model" class="h-3.5 w-3.5 text-white" aria-hidden="true" />
        </span>
      </span>
      <span class="leading-snug">
        <span class="block text-[13px] text-ink-soft">
          <slot>{{ label }}</slot>
        </span>
        <span v-if="description" class="mt-0.5 block text-xs text-muted">
          {{ description }}
        </span>
      </span>
    </label>
    <p v-if="error" class="ml-7 mt-1.5 text-[12.5px] text-danger">{{ error }}</p>
  </div>
</template>
