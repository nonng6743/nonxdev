'use client';

import { Suspense, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MailCheck, Loader2, AlertTriangle } from 'lucide-react';
import AuthCard from '@/components/finance/AuthCard';
import InputField from '@/components/finance/InputField';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<AuthCard title="ยืนยันอีเมล" subtitle="กำลังโหลด...">{null}</AuthCard>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const search = useSearchParams();
  const initialEmail = search.get('email') ?? '';
  const status = search.get('status');
  const sent = search.get('sent') === '1';

  const [pending, startTransition] = useTransition();
  const [resentMessage, setResentMessage] = useState<string | null>(null);

  function onResend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResentMessage(null);

    const email = String(new FormData(e.currentTarget).get('email') || '').trim().toLowerCase();
    if (!email) return;

    startTransition(async () => {
      await fetch('/api/finance/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setResentMessage('ถ้าอีเมลนี้ยังไม่ยืนยัน เราจะส่งลิงก์ใหม่ให้ตรวจสอบ inbox');
    });
  }

  const isInvalid = status === 'invalid';

  return (
    <AuthCard
      title={isInvalid ? 'ลิงก์ไม่ถูกต้อง' : 'ยืนยันอีเมลของคุณ'}
      subtitle={
        isInvalid
          ? 'ลิงก์ยืนยันใช้ไปแล้ว หมดอายุ หรือไม่ถูกต้อง — ขอลิงก์ใหม่ได้ด้านล่าง'
          : 'เราได้ส่งลิงก์ยืนยันไปยังอีเมลของคุณ กรุณาตรวจสอบ inbox (และโฟลเดอร์ spam)'
      }
      footer={
        <div className="flex items-center justify-between">
          <span>ยืนยันแล้ว?</span>
          <Link href="/finance/login" className="text-gold-300 hover:text-gold-200 transition-colors">
            เข้าสู่ระบบ →
          </Link>
        </div>
      }
    >
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-gold-400/15 bg-ink-800/40 p-4">
        <span className="mt-0.5 inline-flex w-9 h-9 shrink-0 items-center justify-center rounded-lg border border-gold-400/30 bg-ink-800 text-gold-300">
          {isInvalid ? <AlertTriangle className="w-4 h-4" /> : <MailCheck className="w-4 h-4" />}
        </span>
        <div className="text-sm text-neutral-300 leading-relaxed">
          {isInvalid ? (
            <>ลิงก์อาจหมดอายุไปแล้ว (อายุ 24 ชั่วโมง) ลองขอลิงก์ใหม่</>
          ) : sent ? (
            <>ส่งลิงก์ใหม่เรียบร้อย เปิดอีเมลของคุณแล้วกดลิงก์ยืนยัน</>
          ) : (
            <>กดลิงก์ในอีเมลเพื่อยืนยันบัญชี ลิงก์จะหมดอายุใน 24 ชั่วโมง</>
          )}
        </div>
      </div>

      <form onSubmit={onResend} className="space-y-4">
        <InputField
          id="email"
          name="email"
          type="email"
          label="ส่งลิงก์ยืนยันใหม่"
          defaultValue={initialEmail}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />

        {resentMessage && (
          <p className="text-sm text-gold-200 border border-gold-400/25 bg-gold-400/5 rounded-lg px-4 py-3">
            {resentMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium text-sm tracking-wide
                     border border-gold-400/30 text-gold-200 hover:border-gold-300/60 hover:text-white
                     transition-colors disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> กำลังส่ง...
            </>
          ) : (
            <>ส่งลิงก์ยืนยันอีกครั้ง</>
          )}
        </button>
      </form>
    </AuthCard>
  );
}
