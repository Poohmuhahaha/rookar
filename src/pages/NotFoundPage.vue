<script setup lang="ts">
import { Link } from '@tanstack/vue-router'
import BrandLogo from '@/components/brand/BrandLogo.vue'
import AppButton from '@/components/ui/AppButton.vue'
</script>

<template>
  <div class="flex min-h-dvh flex-col items-center justify-center bg-canvas px-5 text-center">
    <BrandLogo :mark-size="44" />
    <p class="mt-8 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-700">404</p>
    <h1 class="mt-2 text-h1 font-semibold tracking-tight text-ink">ไม่พบหน้าที่คุณกำลังมองหา</h1>
    <p class="mt-2 max-w-sm text-sm leading-relaxed text-muted">
      หน้านี้อาจถูกย้ายหรือไม่มีอยู่แล้ว กลับไปเริ่มจากภาพรวมธุรกิจของคุณได้เลย
    </p>
    <Link to="/app" class="mt-6">
      <AppButton>กลับไปหน้าภาพรวม</AppButton>
    </Link>
  </div>
</template>
