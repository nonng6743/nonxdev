import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { z } from 'zod';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/mongoose';
import { Category } from '@/models/Category';
import { ensureDefaultCategories, listUserCategories, generateSlug } from '@/lib/categories';
import { logger } from '@/lib/logger';

const createSchema = z.object({
  type: z.enum(['income', 'expense']),
  name: z.string().trim().min(1, 'กรุณาระบุชื่อหมวด').max(40),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const userId = new Types.ObjectId(session.user.id);
    await ensureDefaultCategories(userId);
    const categories = await listUserCategories(userId);
    return NextResponse.json({ categories });
  } catch (err) {
    logger.error('categories_list_failed', {
      userId: session.user.id,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  const userId = new Types.ObjectId(session.user.id);

  try {
    await dbConnect();
    const last = await Category.findOne({ userId, type: parsed.data.type })
      .sort({ order: -1 })
      .select('order')
      .lean();
    const order = (last?.order ?? -1) + 1;

    // Retry slug a few times in case of collision
    let slug = generateSlug(parsed.data.name);
    for (let i = 0; i < 3; i++) {
      const exists = await Category.findOne({ userId, type: parsed.data.type, slug }).lean();
      if (!exists) break;
      slug = generateSlug(parsed.data.name);
    }

    const cat = await Category.create({
      userId,
      type: parsed.data.type,
      name: parsed.data.name,
      slug,
      order,
    });

    return NextResponse.json(
      {
        category: {
          id: cat._id.toString(),
          type: cat.type,
          slug: cat.slug,
          name: cat.name,
          order: cat.order,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    if (typeof err === 'object' && err !== null && 'code' in err && (err as { code?: number }).code === 11000) {
      return NextResponse.json({ error: 'ชื่อหมวดซ้ำ' }, { status: 409 });
    }
    logger.error('category_create_failed', {
      userId: session.user.id,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
