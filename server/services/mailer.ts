import { env } from '../env'

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<{ delivered: boolean }> {
  if (!env.resendApiKey) {
    console.log(`[mail:dev] password reset for ${to}: ${resetUrl}`)
    return { delivered: false }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.mailFrom,
      to: [to],
      subject: 'ตั้งรหัสผ่านใหม่สำหรับ ROOKAR',
      html: `
        <div style="font-family:system-ui,sans-serif;line-height:1.6;color:#111">
          <h2>ตั้งรหัสผ่านใหม่</h2>
          <p>เราได้รับคำขอตั้งรหัสผ่านใหม่สำหรับบัญชี ROOKAR ของคุณ</p>
          <p><a href="${resetUrl}" style="display:inline-block;padding:10px 18px;border-radius:999px;background:#000;color:#fff;text-decoration:none">ตั้งรหัสผ่านใหม่</a></p>
          <p style="color:#666;font-size:13px">ลิงก์นี้จะหมดอายุใน 30 นาที หากคุณไม่ได้ขอตั้งรหัสผ่านใหม่ กรุณาเพิกเฉยต่ออีเมลนี้</p>
        </div>
      `,
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`ส่งอีเมลไม่สำเร็จ (${response.status})${detail ? `: ${detail}` : ''}`)
  }
  return { delivered: true }
}
