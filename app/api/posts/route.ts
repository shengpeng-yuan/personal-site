import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { buildPostData, isUniqueConstraintError, type PostPayload } from '@/lib/validators';

export const runtime = 'nodejs';

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const posts = await prisma.post.findMany({
    orderBy: [{ updatedAt: 'desc' }],
    select: {
      id: true,
      slug: true,
      titleZh: true,
      titleEn: true,
      tags: true,
      published: true,
      featured: true,
      views: true,
      publishedAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ items: posts });
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as PostPayload;
    const item = await prisma.post.create({ data: buildPostData(body) });
    return NextResponse.json({ item }, { status: 201 });
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
