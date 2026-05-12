'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import AuthCard from '@/components/finance/AuthCard';
import InputField from '@/components/finance/InputField';

export default function SignupPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const data = new FormData(e.currentTarget);
    const payload = {
      name: String(data.get('name') || '').trim() || undefined,
      email: String(data.get('email') || '').trim().toLowerCase(),
      password: String(data.get('password') || ''),
    };

    startTransition(async () => {
      const res = await fetch('/api/finance/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'สมัครไม่สำเร็จ ลองอีกครั้ง');
        return;
      }

      router.push(`/finance/verify-email?email=${encodeURIComponent(payload.email)}&sent=1`);
    });
  }

  return (
    <AuthCard
      title="สร้างบัญชีใหม่"
      subtitle="เริ่มจัดการรายรับรายจ่ายส่วนตัวอย่างเป็นระบบ"
      footer={
        <div className="flex items-center justify-between">
          <span>มีบัญชีอยู่แล้ว?</span>
          <Link href="/finance/login" className="text-gold-300 hover:text-gold-200 transition-colors">
            เข้าสู่ระบบ →
          </Link>
        </div>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <InputField
          id="name"
          name="name"
          label="ชื่อที่ใช้แสดง (ไม่บังคับ)"
          placeholder="เช่น Pong"
          autoComplete="name"
        />
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
          label="รหัสผ่าน (อย่างน้อย 8 ตัว)"
          placeholder="••••••••"
          minLength={8}
          autoComplete="new-password"
          required
        />

        {error && (
          <p className="text-sm text-red-300 border border-red-400/30 bg-red-500/10 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <p className="text-xs text-neutral-500 leading-relaxed">
          หลังสมัครเสร็จ เราจะส่งลิงก์ยืนยันอีเมลให้ตรวจสอบใน inbox ก่อนเข้าใช้งานครั้งแรก
        </p>

        <button
          type="submit"
          disabled={pending}
          className="group w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-semibold text-sm tracking-wide
                     bg-linear-to-b from-gold-200 via-gold-400 to-gold-600 text-ink-900 gold-glow
                     transition-transform duration-300 hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100"
        >
          {pending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> กำลังสมัคร...
            </>
          ) : (
            <>
              สมัครสมาชิก
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </>
          )}
        </button>
      </form>
    </AuthCard>
  );
}
