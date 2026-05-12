'use client';

import { Suspense, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { ArrowUpRight, CheckCircle2, Loader2 } from 'lucide-react';
import AuthCard from '@/components/finance/AuthCard';
import InputField from '@/components/finance/InputField';

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthCard title="เข้าสู่ระบบ" subtitle="กำลังโหลด...">{null}</AuthCard>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const callbackUrl = search.get('callbackUrl') || '/finance/dashboard';
  const justVerified = search.get('verified') === '1';

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [lastEmail, setLastEmail] = useState<string>('');

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResendMessage(null);

    const data = new FormData(e.currentTarget);
    const email = String(data.get('email') || '').trim().toLowerCase();
    const password = String(data.get('password') || '');
    setLastEmail(email);

    startTransition(async () => {
      const result = await signIn('credentials', { email, password, redirect: false });

      if (result?.error) {
        setError('อีเมล/รหัสผ่านไม่ถูกต้อง หรืออีเมลยังไม่ได้ยืนยัน');
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    });
  }

  async function resendVerification() {
    if (!lastEmail) return;
    setResendMessage(null);
    await fetch('/api/finance/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: lastEmail }),
    });
    setResendMessage('ถ้าอีเมลนี้ยังไม่ยืนยัน เราจะส่งลิงก์ใหม่ให้ตรวจสอบ inbox');
  }

  return (
    <AuthCard
      title="เข้าสู่ระบบ"
      subtitle="ยินดีต้อนรับกลับ ดำเนินการบันทึกรายรับรายจ่ายต่อได้เลย"
      footer={
        <div className="flex items-center justify-between">
          <span>ยังไม่มีบัญชี?</span>
          <Link href="/finance/signup" className="text-gold-300 hover:text-gold-200 transition-colors">
            สมัครสมาชิก →
          </Link>
        </div>
      }
    >
      {justVerified && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 mt-0.5 shrink-0" />
          <p className="text-sm text-emerald-100">ยืนยันอีเมลสำเร็จ เข้าสู่ระบบเพื่อเริ่มใช้งานได้เลย</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        <InputField
          id="email"
          name="email"
          type="email"
          label="อีเมล"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
        <InputField
          id="password"
          name="password"
          type="password"
          label="รหัสผ่าน"
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />

        {error && (
          <div className="space-y-3">
            <p className="text-sm text-red-300 border border-red-400/30 bg-red-500/10 rounded-lg px-4 py-3">
              {error}
            </p>
            {lastEmail && (
              <button
                type="button"
                onClick={resendVerification}
                className="text-xs text-gold-300 hover:text-gold-200 underline underline-offset-4"
              >
                ส่งลิงก์ยืนยันอีเมลใหม่
              </button>
            )}
            {resendMessage && (
              <p className="text-xs text-gold-200">{resendMessage}</p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="group w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-semibold text-sm tracking-wide
                     bg-linear-to-b from-gold-200 via-gold-400 to-gold-600 text-ink-900 gold-glow
                     transition-transform duration-300 hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100"
        >
          {pending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> กำลังเข้าสู่ระบบ...
            </>
          ) : (
            <>
              เข้าสู่ระบบ
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </>
          )}
        </button>
      </form>
    </AuthCard>
  );
}
