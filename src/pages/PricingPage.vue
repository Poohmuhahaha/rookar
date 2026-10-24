<script setup lang="ts">
import { Link } from '@tanstack/vue-router'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  HelpCircle,
  Sparkles,
  Zap,
} from '@lucide/vue'
import LogoMark from '@/components/brand/LogoMark.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { getSession } from '@/lib/mockApi'

const session = getSession()

const plans = [
  {
    id: 'free',
    name: 'Free',
    badge: 'สำหรับทดลองใช้งาน',
    price: '฿0',
    period: '/ เดือน',
    popular: false,
    description: 'ทดลองใช้งาน Core AI Chat และระบบวิเคราะห์ข้อมูล 1 โปรเจกต์ธุรกิจ',
    features: [
      'โควต้าคำถาม AI: 200 ครั้ง / เดือน',
      'เชื่อมต่อข้อมูล 1 โปรเจกต์ธุรกิจ',
      'แดชบอร์ดสรุปสุขภาพธุรกิจภาพรวม',
      'ระบบจับคู่คอลัมน์อัตโนมัติ (AI Column Mapping)',
      'การจัดเก็บข้อมูลปลอดภัยในเครื่อง (PDPA Compliant)',
    ],
    cta: 'เริ่มต้นใช้งานฟรี',
    to: '/signup',
  },
  {
    id: 'founder_pro',
    name: 'Founder Pro',
    badge: '★ แนะนำสำหรับเจ้าของธุรกิจ',
    price: '฿299',
    origPrice: 'สมมติฐาน IDEA',
    period: '/ เดือน (ฟรีตลอดช่วง Trial)',
    popular: true,
    description: 'สำหรับเจ้าของกิจการเดี่ยวที่ต้องการเจาะลึกกำไร ขยายประวัติ และใช้ Specialist AI ครบทั้ง 4 ด้าน',
    features: [
      'โควต้าคำถาม AI: ไม่จำกัด (Streaming ความเร็วสูง)',
      'Specialist AI Workflows: Finance, Market, Strategy, Planning',
      'เครื่องมือจำลองฉากทัศน์ What-If Scenario Builder',
      'เชื่อมต่อบริบทเศรษฐกิจมหภาค (GDP สศช. & เงินเฟ้อ ธปท.)',
      'ประวัติบทสนทนาและบริบทธุรกิจต่อเนื่อง (Project Context)',
      'แปลงผลวิเคราะห์เป็น Action Plan Checklist ทันที',
      'การสนับสนุนระดับเร่งด่วน (Priority Support)',
    ],
    cta: 'รับสิทธิ์ Founder Pro ใน Trial',
    to: '/signup',
  },
  {
    id: 'business',
    name: 'Business',
    badge: 'สำหรับทีมและ SME',
    price: '฿990',
    origPrice: 'สมมติฐาน IDEA',
    period: '/ เดือน',
    popular: false,
    description: 'Workspace สำหรับทีม/ธุรกิจขนาดเล็ก รองรับหลายชุดข้อมูล การแชร์งาน และการส่งออกรายงาน',
    features: [
      'ทุกความสามารถใน Founder Pro',
      'Team Workspace รองรับทีมทำงานร่วมกัน 3–5 บัญชี',
      'เชื่อมต่อและวิเคราะห์หลายชุดข้อมูลพร้อมกัน (ยอดขาย, วัตถุดิบ, ค่าแรง, ค่าเช่า)',
      'ส่งออกรายงานการเงิน & บทวิเคราะห์ผู้บริหาร (Excel / PDF)',
      'AI ตรวจสอบความถูกต้องของข้อมูลเชิงลึก (Data Quality Check)',
      'บริการช่วยจัดเตรียมและขึ้นระบบข้อมูลตั้งต้น (Onboarding Assistance)',
    ],
    cta: 'ทดลองใช้สำหรับธุรกิจ',
    to: '/signup',
  },
  {
    id: 'institution',
    name: 'Institution',
    badge: 'สำหรับสถาบัน & Cohort',
    price: '฿24,000',
    period: '/ ปี (~24K/ปี)',
    popular: false,
    description: 'สิทธิ์การใช้งานสำหรับมหาวิทยาลัย, ศูนย์บ่มเพาะ (Incubator), หอการค้า หรือหน่วยงานพัฒนา SME',
    features: [
      'Cohort License รองรับผู้ประกอบการ 20–50 กิจการในโครงการ',
      'แดชบอร์ดภาพรวมความก้าวหน้าและการตัดสินใจของทั้ง Cohort',
      'หลักสูตร & เวิร์กช็อป Human-AI Interaction (HAI) ทางธุรกิจ',
      'ระบบจัดการสิทธิ์และรายงานผลลัพธ์รายโครงการ',
      'ปรับแต่งโมเดลและคลังความรู้เฉพาะทางอุตสาหกรรม',
      'ผู้ดูแลโครงการและให้คำปรึกษาเฉพาะทาง (Dedicated Advisor)',
    ],
    cta: 'ติดต่อฝ่ายความร่วมมือ',
    to: 'mailto:hello@rookar.co',
  },
]
</script>

<template>
  <div class="min-h-screen bg-[#F7F9F9] text-ink selection:bg-black selection:text-white">
    <!-- Header -->
    <header class="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-neutral-200/60">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" class="flex items-center gap-2.5">
          <LogoMark :size="32" />
          <span class="text-base font-bold tracking-tight text-ink">ROOKAR</span>
        </Link>

        <div class="flex items-center gap-3">
          <Link
            to="/"
            class="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-black transition"
          >
            <ArrowLeft class="h-3.5 w-3.5" />
            กลับหน้าแรก
          </Link>
          <Link
            to="/login"
            class="text-xs font-semibold text-ink hover:text-neutral-600 transition px-2"
          >
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
      <!-- Title -->
      <div class="text-center max-w-3xl mx-auto">
        <div class="inline-flex items-center gap-2 rounded-full bg-black px-3.5 py-1 text-xs font-semibold text-white mb-4">
          <Sparkles class="h-3.5 w-3.5" />
          <span>ROOKAR Revenue Model · โครงการ TED Fund IDEA</span>
        </div>
        <h1 class="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl md:text-5xl">
          โมเดลราคาที่ออกแบบเพื่อผู้ประกอบการไทย
        </h1>
        <p class="mt-4 text-sm sm:text-base text-muted leading-relaxed">
          โครงสร้างราคาเป็นสมมติฐานที่จะร่วมทดสอบในโครงการ IDEA เพื่อวัด Willingness to Pay (WTP) และเปิดให้ผู้เข้าร่วม Closed Trial ใช้งานระดับ Pro ได้ฟรีตลอดระยะเวลาทดสอบ
        </p>
      </div>

      <!-- Pricing Cards -->
      <div class="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 items-stretch">
        <div
          v-for="plan in plans"
          :key="plan.id"
          :class="[
            'flex flex-col justify-between rounded-[32px] p-8 transition-all',
            plan.popular
              ? 'bg-black text-white ring-4 ring-black/10'
              : 'bg-white text-ink hover:bg-neutral-50',
          ]"
        >
          <div>
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-bold">{{ plan.name }}</h2>
              <span
                :class="[
                  'rounded-full px-2.5 py-1 text-[11px] font-semibold',
                  plan.popular ? 'bg-white text-black' : 'bg-[#f4f5f7] text-neutral-800',
                ]"
              >
                {{ plan.badge }}
              </span>
            </div>

            <p class="mt-4 text-xs leading-relaxed" :class="plan.popular ? 'text-neutral-300' : 'text-muted'">
              {{ plan.description }}
            </p>

            <div class="mt-6 flex items-baseline gap-2">
              <span v-if="plan.origPrice" class="text-sm line-through text-neutral-400">
                {{ plan.origPrice }}
              </span>
              <span class="text-4xl font-extrabold tracking-tight">{{ plan.price }}</span>
              <span class="text-xs font-medium" :class="plan.popular ? 'text-neutral-300' : 'text-muted'">
                {{ plan.period }}
              </span>
            </div>

            <!-- Features List -->
            <ul class="mt-8 space-y-3.5 text-xs">
              <li v-for="(feat, idx) in plan.features" :key="idx" class="flex items-start gap-2.5">
                <Check
                  class="h-4 w-4 shrink-0 mt-0.5"
                  :class="plan.popular ? 'text-white' : 'text-black'"
                />
                <span :class="plan.popular ? 'text-neutral-200' : 'text-neutral-700'">{{ feat }}</span>
              </li>
            </ul>
          </div>

          <div class="mt-10">
            <template v-if="plan.to.startsWith('mailto:')">
              <a
                :href="plan.to"
                class="flex h-12 w-full items-center justify-center rounded-full bg-[#f4f5f7] text-xs font-bold text-ink transition hover:bg-neutral-200"
              >
                {{ plan.cta }}
              </a>
            </template>
            <template v-else>
              <Link
                :to="plan.to"
                :class="[
                  'flex h-12 w-full items-center justify-center gap-2 rounded-full text-xs font-bold transition',
                  plan.popular
                    ? 'bg-white text-black hover:bg-neutral-100'
                    : 'bg-black text-white hover:bg-neutral-800',
                ]"
              >
                {{ plan.cta }}
                <ArrowRight class="h-3.5 w-3.5" />
              </Link>
            </template>
          </div>
        </div>
      </div>

      <!-- FAQ Note -->
      <div class="mt-16 rounded-[28px] bg-white p-8 text-center max-w-2xl mx-auto">
        <h3 class="text-base font-bold text-ink">มีข้อสงสัยเกี่ยวกับแพ็กเกจหรือต้องการเชื่อมต่อพิเศษ?</h3>
        <p class="mt-2 text-xs text-muted leading-relaxed">
          ทีมงาน ROOKAR พร้อมให้คำปรึกษาและช่วยแนะนำวิธีการเตรียมข้อมูลไฟล์ธุรกิจฟรี
        </p>
        <a
          href="mailto:hello@rookar.co"
          class="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-ink hover:underline"
        >
          ติดต่อ hello@rookar.co →
        </a>
      </div>
    </main>
  </div>
</template>
