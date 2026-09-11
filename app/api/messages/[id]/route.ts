import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

async function findMessage(id: string) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) return null;
  return prisma.message.findUnique({ where: { id: numericId } });
}

/** 标记已读 / 未读 */
export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const existing = await findMessage(id);
  if (!existing) return NextResponse.json({ error: '留言不存在' }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const item = await prisma.message.update({
    where: { id: existing.id },
    data: { read: Boolean(body?.read) },
  });

  return NextResponse.json({ item });
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const existing = await findMessage(id);
  if (!existing) return NextResponse.json({ error: '留言不存在' }, { status: 404 });

  await prisma.message.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}
