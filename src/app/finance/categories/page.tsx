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
    <main className="min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start justify-between mb-10 flex-wrap gap-4">
          <div>
            <Link
              href="/finance/dashboard"
              className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.25em] text-neutral-500 hover:text-gold-200 transition-colors mb-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              กลับ Dashboard
            </Link>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-gold-300/80 mb-3">
              <Tags className="w-4 h-4" />
              จัดการหมวด
            </div>
            <h1 className="text-3xl md:text-5xl font-bold gold-gradient-text">หมวดของฉัน</h1>
            <p className="text-neutral-400 mt-2 max-w-xl">
              เพิ่ม แก้ไข หรือลบหมวดที่ใช้บันทึกรายรับ-รายจ่าย ปรับให้ตรงกับไลฟ์สไตล์ของคุณ
            </p>
          </div>
        </div>

        <CategoryManager initial={categories} />
      </div>
    </main>
  );
}
