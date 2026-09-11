import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

/** 阅读量自增（公开接口，失败不影响页面） */
export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  const numericId = Number(id);

  if (!Number.isInteger(numericId)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    await prisma.post.update({
      where: { id: numericId },
      data: { views: { increment: 1 } },
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  return NextResponse.json({ ok: true });
}
