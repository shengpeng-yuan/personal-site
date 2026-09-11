import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { buildProjectData, isUniqueConstraintError, type ProjectPayload } from '@/lib/validators';

export const runtime = 'nodejs';

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const items = await prisma.project.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as ProjectPayload;
    const item = await prisma.project.create({ data: buildProjectData(body) });
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
