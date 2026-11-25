<script setup lang="ts">
import { computed } from 'vue'
import { Link } from '@tanstack/vue-router'
import { CheckCircle2 } from '@lucide/vue'
import BrandLogo from '@/components/brand/BrandLogo.vue'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher.vue'
import KpiCard from '@/components/charts/KpiCard.vue'
import { t } from '@/lib/i18n'

const points = computed(() => [t('layout.point1'), t('layout.point2'), t('layout.point3')])
</script>

<template>
  <div class="min-h-dvh bg-canvas lg:grid lg:grid-cols-[1.04fr_0.96fr] lg:gap-4 lg:p-5">
    <aside
      class="relative hidden min-h-[calc(100dvh-2.5rem)] flex-col justify-between overflow-hidden rounded-[32px] bg-brand-950 p-8 text-white lg:flex xl:p-10"
    >
      <div class="bg-waves absolute inset-0 scale-110 opacity-35 mix-blend-screen" aria-hidden="true" />
      <div
        class="absolute inset-0 rounded-[32px] bg-gradient-to-br from-brand-950/95 via-brand-950/80 to-brand-800/60"
        aria-hidden="true"
      />
      <div
        class="absolute -right-28 top-16 h-72 w-72 rounded-full bg-brand-400/20 blur-3xl"
        aria-hidden="true"
      />

      <div class="relative">
        <BrandLogo variant="light" :mark-size="38" />
      </div>

      <div class="relative max-w-lg py-8 xl:py-10">
        <h2 class="text-balance text-[clamp(2rem,3.2vw,3.1rem)] font-semibold leading-[1.18] tracking-[-0.035em]">
          {{ t('layout.headlineA') }}
          <br />
          {{ t('layout.headlineB') }}
        </h2>
        <p class="mt-5 max-w-md text-[15px] leading-relaxed text-white/75">
          {{ t('layout.subtitle') }}
        </p>

        <div class="mt-7 max-w-sm">
          <KpiCard
            :label="t('layout.kpiLabel')"
            value="฿6,248,500"
            change="+12.4%"
            :note="t('layout.kpiNote')"
            :info="t('layout.kpiInfo')"
            :spark="[980000, 1010000, 1045000, 1090000, 1145000, 1284500]"
          />
        </div>

        <ul class="mt-6 space-y-3">
          <li v-for="point in points" :key="point" class="flex items-center gap-2.5 text-[13px] text-white/75">
            <CheckCircle2 class="h-4 w-4 shrink-0 text-brand-300" aria-hidden="true" />
            {{ point }}
          </li>
        </ul>
      </div>

      <div class="relative flex items-end justify-between gap-6 pt-6">
        <div class="max-w-xs">
          <p class="text-xs leading-relaxed text-white/55">
            {{ t('layout.quote') }}
          </p>
          <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <Link
              to="/policy"
              hash="terms"
              target="_blank"
              rel="noopener noreferrer"
              class="text-[11px] font-medium text-white/60 underline-offset-4 transition hover:text-white hover:underline"
            >
              {{ t('policy.terms') }}
            </Link>
            <Link
              to="/policy"
              hash="privacy"
              target="_blank"
              rel="noopener noreferrer"
              class="text-[11px] font-medium text-white/60 underline-offset-4 transition hover:text-white hover:underline"
            >
              {{ t('policy.privacy') }}
            </Link>
          </div>
        </div>
        <p class="text-[11px] text-white/40">Business, clearly.</p>
      </div>
    </aside>

    <main class="flex min-h-dvh flex-col lg:min-h-[calc(100dvh-2.5rem)]">
      <div class="flex items-center justify-between gap-3 p-5 lg:hidden">
        <BrandLogo :mark-size="34" />
        <div class="flex items-center gap-3">
          <span class="hidden text-[11px] font-medium tracking-[0.14em] text-faint sm:inline">
            BUSINESS, CLEARLY.
          </span>
          <LanguageSwitcher />
        </div>
      </div>
      <div class="hidden justify-end px-5 pt-5 sm:px-8 lg:flex lg:px-12">
        <LanguageSwitcher />
      </div>
      <div class="flex flex-1 items-center justify-center px-5 pb-10 pt-2 sm:px-8 lg:px-12 lg:py-6">
        <div class="w-full max-w-[404px]">
          <slot />
        </div>
      </div>
      <footer class="px-6 pb-5 text-center text-[11px] text-faint lg:px-12">
        {{ t('layout.footer') }}
      </footer>
    </main>
  </div>
</template>
