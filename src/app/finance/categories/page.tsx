import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Types } from 'mongoose';
import { ArrowLeft, Tags } from 'lucide-react';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/mongoose';
import { ensureDefaultCategories, listUserCategories } from '@/lib/categories';
import CategoryManager from '@/components/finance/CategoryManager';

export default async function CategoriesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/finance/login');

  await dbConnect();
  const userId = new Types.ObjectId(session.user.id);
  await ensureDefaultCategories(userId);
  const categories = await listUserCategories(userId);

  return (
    <main className="min-h-screen pt-24 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 sm:mb-10">
          <Link
            href="/finance/dashboard"
            className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.25em] text-neutral-500 hover:text-gold-200 transition-colors mb-3 sm:mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            กลับ Dashboard
          </Link>
          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-[0.25em] sm:tracking-[0.3em] text-gold-300/80 mb-2 sm:mb-3">
            <Tags className="w-4 h-4" />
            จัดการหมวด
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold gold-gradient-text">หมวดของฉัน</h1>
          <p className="text-sm sm:text-base text-neutral-400 mt-2 max-w-xl">
            เพิ่ม แก้ไข หรือลบหมวดที่ใช้บันทึกรายรับ-รายจ่าย ปรับให้ตรงกับไลฟ์สไตล์ของคุณ
          </p>
        </div>

        <CategoryManager initial={categories} />
      </div>
    </main>
  );
}
