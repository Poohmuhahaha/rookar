<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { Eye, EyeOff, Search } from '@lucide/vue'
import { cn } from '@/lib/cn'

const props = withDefaults(
  defineProps<{
    label?: string
    type?: 'text' | 'email' | 'password' | 'tel' | 'number'
    placeholder?: string
    hint?: string
    error?: string
    autocomplete?: string
    name?: string
    id?: string
    required?: boolean
    disabled?: boolean
    readonly?: boolean
    inputmode?: 'text' | 'numeric' | 'decimal' | 'email' | 'tel' | 'search'
    search?: boolean
    size?: 'md' | 'lg'
    modelValue?: string
  }>(),
  {
    type: 'text',
    required: false,
    disabled: false,
    readonly: false,
    search: false,
    size: 'md',
    modelValue: '',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

const model = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
})

const autoId = useId()
const fieldId = computed(() => props.id ?? `field-${autoId}`)
const showPassword = ref(false)
const actualType = computed(() =>
  props.type === 'password' ? (showPassword.value ? 'text' : 'password') : props.type,
)
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
      <Search
        v-if="search"
        class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
        aria-hidden="true"
      />
      <input
        :id="fieldId"
        v-model="model"
        :type="actualType"
        :name="name"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :required="required"
        :disabled="disabled"
        :readonly="readonly"
        :inputmode="inputmode"
        :aria-invalid="Boolean(error)"
        :aria-describedby="error || hint ? messageId : undefined"
        :class="
          cn(
            'w-full rounded-lg text-ink placeholder:text-faint transition-all duration-200 focus:outline-none disabled:bg-ink-100/60 disabled:text-muted',
            size === 'lg' ? 'h-12 px-4 text-[15px]' : 'h-11 px-3.5 text-sm',
            search && 'pl-10',
            type === 'password' && 'pr-11',
            error
              ? 'bg-danger-soft/40 focus:bg-danger-soft/60'
              : 'bg-ink-50 focus:bg-ink-100',
          )
        "
        @blur="emit('blur', $event)"
        @focus="emit('focus', $event)"
      />
      <button
        v-if="type === 'password'"
        type="button"
        class="absolute right-1.5 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition hover:bg-ink-50 hover:text-brand-600"
        :aria-label="showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'"
        @click="showPassword = !showPassword"
      >
        <EyeOff v-if="showPassword" class="h-4 w-4" aria-hidden="true" />
        <Eye v-else class="h-4 w-4" aria-hidden="true" />
      </button>
      <slot name="trailing" />
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
