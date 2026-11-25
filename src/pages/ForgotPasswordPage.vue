<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Link } from '@tanstack/vue-router'
import { AlertCircle, ArrowLeft, CheckCircle2, Mail } from '@lucide/vue'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import AppButton from '@/components/ui/AppButton.vue'
import TextField from '@/components/ui/TextField.vue'
import { requestPasswordReset } from '@/lib/mockApi'
import { t, translateServerError } from '@/lib/i18n'

const form = reactive({ email: '' })
const errors = reactive<{ email?: string }>({})
const loading = ref(false)
const sent = ref(false)
const sentEmail = ref('')
const devResetUrl = ref<string | null>(null)

async function handleSubmit() {
  errors.email = undefined
  if (!form.email.trim()) {
    errors.email = t('err.emailRequired')
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = t('err.emailInvalid')
    return
  }
  loading.value = true
  try {
    const result = await requestPasswordReset(form.email.trim())
    sentEmail.value = form.email.trim()
    devResetUrl.value = result.devResetUrl ?? null
    sent.value = true
  } catch (error) {
    errors.email =
      error instanceof Error ? translateServerError(error.message, 'err.genericSend') : t('err.genericSend')
  } finally {
    loading.value = false
  }
}

function retry() {
  sent.value = false
  devResetUrl.value = null
}
</script>

<template>
  <AuthLayout>
    <div v-if="!sent">
      <Mail class="h-6 w-6 text-brand-400" aria-hidden="true" />
      <h1 class="mt-4 text-[28px] font-semibold leading-tight tracking-[-0.025em] text-ink">
        {{ t('forgot.title') }}
      </h1>
      <p class="mt-2 max-w-sm text-[13px] leading-relaxed text-muted">
        {{ t('forgot.subtitle') }}
      </p>

      <form class="mt-7 space-y-4" novalidate @submit.prevent="handleSubmit">
        <TextField
          v-model="form.email"
          :label="t('common.email')"
          type="email"
          autocomplete="email"
          :placeholder="t('common.emailPlaceholder')"
          size="lg"
          :error="errors.email"
        />
        <AppButton type="submit" size="lg" block :loading="loading">
          {{ t('forgot.submit') }}
        </AppButton>
      </form>

      <Link
        to="/login"
        class="mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-700 underline-offset-4 transition hover:text-brand-900 hover:underline"
      >
        <ArrowLeft class="h-4 w-4" aria-hidden="true" />
        {{ t('common.backToLogin') }}
      </Link>
    </div>

    <div v-else class="text-center sm:text-left">
      <CheckCircle2 class="mx-auto h-7 w-7 text-success sm:mx-0" aria-hidden="true" />
      <h1 class="mt-4 text-[26px] font-semibold leading-tight tracking-[-0.025em] text-ink">
        {{ t('forgot.sentTitle') }}
      </h1>
      <p class="mt-2 text-[13px] leading-relaxed text-muted">
        {{ t('forgot.sentBefore') }} <span class="font-medium text-ink-soft">{{ sentEmail }}</span>
        {{ t('forgot.sentAfter') }}
      </p>
      <div class="mt-5 flex items-start gap-2 bg-ink-50 px-3.5 py-3 text-left text-xs leading-relaxed text-muted">
        <AlertCircle class="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-600" aria-hidden="true" />
        {{ t('forgot.spam') }}
      </div>
      <div v-if="devResetUrl" class="mt-3 bg-brand-50 px-3.5 py-3 text-left text-xs leading-relaxed text-brand-800">
        <p class="font-semibold">{{ t('forgot.devTitle') }}</p>
        <a :href="devResetUrl" class="mt-1 inline-block font-semibold underline underline-offset-4">
          {{ t('forgot.devLink') }}
        </a>
      </div>
      <AppButton variant="secondary" block class="mt-5" @click="retry">
        {{ t('forgot.retry') }}
      </AppButton>
      <Link
        to="/login"
        class="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-700 underline-offset-4 transition hover:text-brand-900 hover:underline"
      >
        <ArrowLeft class="h-4 w-4" aria-hidden="true" />
        {{ t('common.backToLogin') }}
      </Link>
    </div>
  </AuthLayout>
</template>
