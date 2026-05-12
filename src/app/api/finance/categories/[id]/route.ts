import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { z } from 'zod';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/mongoose';
import { Category } from '@/models/Category';
import { Transaction } from '@/models/Transaction';
import { logger } from '@/lib/logger';

const patchSchema = z.object({
  name: z.string().trim().min(1).max(40).optional(),
  order: z.number().int().min(0).max(9999).optional(),
});

async function getOwnedCategory(id: string, userId: Types.ObjectId) {
  if (!Types.ObjectId.isValid(id)) return null;
  return Category.findOne({ _id: new Types.ObjectId(id), userId });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  try {
    await dbConnect();
    const userId = new Types.ObjectId(session.user.id);
    const category = await getOwnedCategory(id, userId);
    if (!category) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (parsed.data.name !== undefined) category.name = parsed.data.name;
    if (parsed.data.order !== undefined) category.order = parsed.data.order;
    await category.save();

    return NextResponse.json({
      category: {
        id: category._id.toString(),
        type: category.type,
        slug: category.slug,
        name: category.name,
        order: category.order,
      },
    });
  } catch (err) {
    logger.error('category_update_failed', {
      userId: session.user.id,
      categoryId: id,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;
  const url = new URL(req.url);
  const reassignTo = url.searchParams.get('reassignTo'); // optional slug to move existing tx to

  try {
    await dbConnect();
    const userId = new Types.ObjectId(session.user.id);
    const category = await getOwnedCategory(id, userId);
    if (!category) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    let txAffected = 0;
    if (reassignTo) {
      const target = await Category.findOne({ userId, type: category.type, slug: reassignTo }).lean();
      if (!target) {
        return NextResponse.json({ error: 'หมวดปลายทางไม่พบ' }, { status: 400 });
      }
      const res = await Transaction.updateMany(
        { userId, category: category.slug },
        { $set: { category: target.slug } },
      );
      txAffected = res.modifiedCount ?? 0;
    }

    await Category.deleteOne({ _id: category._id });
    return NextResponse.json({ ok: true, txAffected });
  } catch (err) {
    logger.error('category_delete_failed', {
      userId: session.user.id,
      categoryId: id,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
