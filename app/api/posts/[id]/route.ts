import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { buildPostData, isUniqueConstraintError, type PostPayload } from '@/lib/validators';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

async function findPost(id: string) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) return null;
  return prisma.post.findUnique({ where: { id: numericId } });
}

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const post = await findPost(id);
  if (!post) return NextResponse.json({ error: '文章不存在' }, { status: 404 });

  return NextResponse.json({ item: post });
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const existing = await findPost(id);
  if (!existing) return NextResponse.json({ error: '文章不存在' }, { status: 404 });

  try {
    const body = (await request.json()) as PostPayload;
    const item = await prisma.post.update({
      where: { id: existing.id },
      data: buildPostData(body, { publishedAt: existing.publishedAt }),
    });
    return NextResponse.json({ item });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: '该访问路径（slug）已被占用，请修改' }, { status: 409 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '保存失败' },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const existing = await findPost(id);
  if (!existing) return NextResponse.json({ error: '文章不存在' }, { status: 404 });

  await prisma.post.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}
