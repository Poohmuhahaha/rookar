<script setup lang="ts">
import { Link } from '@tanstack/vue-router'
import { ArrowRight, Check } from '@lucide/vue'
import BrandLogo from '@/components/brand/BrandLogo.vue'
import { getSession } from '@/lib/mockApi'

const session = getSession()

const plans = [
  {
    id: 'free',
    name: 'Free',
    badge: 'สำหรับทดลองใช้งาน',
    price: '฿0',
    origPrice: '',
    period: 'ต่อเดือน',
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
    note: '',
  },
  {
    id: 'founder_pro',
    name: 'Founder Pro',
    badge: 'แนะนำสำหรับเจ้าของธุรกิจ',
    price: '฿299',
    origPrice: 'ราคาสมมติฐานสำหรับโครงการ IDEA',
    period: 'ต่อเดือน · ฟรีตลอดช่วง Trial',
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
    note: '',
  },
  {
    id: 'business',
    name: 'Business',
    badge: 'สำหรับทีมและ SME',
    price: '฿990',
    origPrice: 'ราคาสมมติฐานสำหรับโครงการ IDEA',
    period: 'ต่อเดือน',
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
    note: '',
  },
  {
    id: 'institution',
    name: 'Institution',
    badge: 'สำหรับสถาบัน & Cohort',
    price: '฿24,000',
    origPrice: '',
    period: 'ต่อปี (~24K/ปี)',
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
    note: '',
  },
]
</script>

<template>
  <div class="min-h-screen bg-[#f4f5f7] text-ink selection:bg-black selection:text-white">
    <header class="sticky top-0 z-50 bg-transparent">
      <div class="px-4 sm:px-5">
        <div class="mx-auto flex max-w-7xl items-center justify-between py-4 2xl:max-w-[1560px] 3xl:max-w-[1680px] 3xl:py-5">
          <Link to="/" aria-label="ROOKAR" class="shrink-0">
            <BrandLogo :mark-size="34" />
          </Link>

          <nav class="hidden items-center gap-7 text-[14px] font-medium text-muted md:flex 3xl:gap-8">
            <Link to="/" hash="features" class="transition hover:text-ink">ฟีเจอร์เด่น</Link>
            <Link to="/" hash="how-it-works" class="transition hover:text-ink">ขั้นตอนการทำงาน</Link>
            <Link to="/pricing" class="text-ink">ตารางราคา</Link>
            <Link to="/" hash="faq" class="transition hover:text-ink">คำถามพบบ่อย</Link>
            <Link to="/docs" class="transition hover:text-ink">Docs</Link>
          </nav>

          <div class="flex items-center gap-2 sm:gap-3">
            <template v-if="session">
              <Link
                to="/app"
                class="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-black px-4 text-[14px] font-semibold text-white transition-colors hover:bg-neutral-800 3xl:h-12 3xl:px-5"
              >
                ไปที่แดชบอร์ด
                <ArrowRight class="h-4 w-4" aria-hidden="true" />
              </Link>
            </template>
            <template v-else>
              <Link
                to="/login"
                class="hidden px-2 text-[14px] font-medium text-ink transition-colors hover:text-muted sm:inline-flex"
              >
                เข้าสู่ระบบ
              </Link>
              <Link
                to="/signup"
                class="inline-flex h-10 items-center justify-center rounded-full bg-black px-4 text-[14px] font-semibold text-white transition-colors hover:bg-neutral-800 3xl:h-12 3xl:px-5"
              >
                เริ่มทดลองฟรี
              </Link>
            </template>
          </div>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-5 sm:pt-16">
      <div class="mx-auto max-w-3xl text-center">
        <h1 class="text-balance text-[32px] font-extrabold leading-tight tracking-[-0.03em] text-ink sm:text-[42px]">
          โมเดลราคาที่ออกแบบเพื่อผู้ประกอบการไทย
        </h1>
        <p class="mx-auto mt-4 max-w-2xl text-[13px] leading-relaxed text-muted sm:text-[14px]">
          โครงสร้างราคาเป็นสมมติฐานที่จะร่วมทดสอบในโครงการ IDEA เพื่อวัด Willingness to Pay (WTP)
          และเปิดให้ผู้เข้าร่วม Closed Trial ใช้งานระดับ Pro ได้ฟรีตลอดระยะเวลาทดสอบ
        </p>
        <ul class="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11.5px] text-muted">
          <li class="flex items-center gap-1.5">
            <Check class="h-3.5 w-3.5 text-ink" aria-hidden="true" />
            ไม่ใช้บัตรเครดิต
          </li>
          <li class="flex items-center gap-1.5">
            <Check class="h-3.5 w-3.5 text-ink" aria-hidden="true" />
            ยกเลิกได้ทุกเมื่อ
          </li>
          <li class="flex items-center gap-1.5">
            <Check class="h-3.5 w-3.5 text-ink" aria-hidden="true" />
            ฟรีตลอดช่วง Closed Trial
          </li>
        </ul>
      </div>

      <div class="mt-10 grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article
          v-for="plan in plans"
          :key="plan.id"
          :class="[
            'relative flex flex-col rounded-[28px] p-6 transition-colors sm:p-7',
            plan.popular
              ? 'bg-black text-white ring-1 ring-black shadow-[0_16px_40px_rgba(0,0,0,0.25)]'
              : 'bg-white text-ink ring-1 ring-black/10 shadow-[0_10px_30px_rgba(0,0,0,0.06)]',
          ]"
        >
          <div class="flex min-h-[26px] items-start justify-between gap-2">
            <h2 class="text-[19px] font-bold leading-tight">{{ plan.name }}</h2>
            <span
              v-if="plan.popular"
              class="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-black"
            >
              แนะนำ
            </span>
          </div>
          <p
            class="mt-1 min-h-[18px] text-[11.5px] font-medium"
            :class="plan.popular ? 'text-white/60' : 'text-muted'"
          >
            {{ plan.badge }}
          </p>

          <p
            class="mt-4 min-h-[76px] text-[12.5px] leading-relaxed"
            :class="plan.popular ? 'text-white/70' : 'text-muted'"
          >
            {{ plan.description }}
          </p>

          <div class="mt-4">
            <p
              class="mb-1 min-h-[15px] text-[10.5px] font-medium"
              :class="plan.popular ? 'text-white/45' : 'text-faint'"
            >
              {{ plan.origPrice }}
            </p>
            <div class="flex items-baseline gap-1.5">
              <span class="text-[34px] font-extrabold leading-none tracking-[-0.04em]">{{ plan.price }}</span>
            </div>
            <p
              class="mt-1.5 min-h-[16px] text-[11px] font-medium"
              :class="plan.popular ? 'text-white/60' : 'text-muted'"
            >
              {{ plan.period }}
            </p>
          </div>

          <ul
            class="mt-5 flex-1 space-y-2.5 border-t pt-5 text-[12px] leading-relaxed"
            :class="plan.popular ? 'border-white/15' : 'border-black/[0.06]'"
          >
            <li v-for="(feat, idx) in plan.features" :key="idx" class="flex items-start gap-2.5">
              <Check
                class="mt-0.5 h-3.5 w-3.5 shrink-0"
                :class="plan.popular ? 'text-white' : 'text-ink'"
                aria-hidden="true"
              />
              <span :class="plan.popular ? 'text-white/80' : 'text-ink-soft'">{{ feat }}</span>
            </li>
          </ul>

          <div class="mt-6">
            <a
              v-if="plan.to.startsWith('mailto:')"
              :href="plan.to"
              class="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#f4f5f7] text-[12px] font-bold text-ink transition hover:bg-neutral-200"
            >
              {{ plan.cta }}
            </a>
            <Link
              v-else
              :to="plan.to"
              :class="[
                'flex h-11 w-full items-center justify-center gap-2 rounded-full text-[12px] font-bold transition',
                plan.popular
                  ? 'bg-white text-black hover:bg-neutral-100'
                  : 'bg-black text-white hover:bg-neutral-800',
              ]"
            >
              {{ plan.cta }}
              <ArrowRight class="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </article>
      </div>

      <div class="mx-auto mt-12 flex max-w-3xl flex-col items-center gap-4 rounded-[28px] bg-white p-6 text-center ring-1 ring-black/[0.04] sm:flex-row sm:justify-between sm:p-7 sm:text-left">
        <div>
          <h2 class="text-[15px] font-bold text-ink">มีข้อสงสัยเกี่ยวกับแพ็กเกจหรือต้องการเชื่อมต่อพิเศษ?</h2>
          <p class="mt-1.5 text-[12px] leading-relaxed text-muted">
            ทีมงาน ROOKAR พร้อมให้คำปรึกษาและช่วยแนะนำวิธีการเตรียมข้อมูลไฟล์ธุรกิจฟรี
          </p>
        </div>
        <a
          href="mailto:hello@rookar.co"
          class="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-black px-5 text-[12px] font-semibold text-white transition hover:bg-neutral-800"
        >
          ติดต่อ hello@rookar.co
          <ArrowRight class="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </main>
  </div>
</template>
