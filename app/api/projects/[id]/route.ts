import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { buildProjectData, isUniqueConstraintError, type ProjectPayload } from '@/lib/validators';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

async function findProject(id: string) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) return null;
  return prisma.project.findUnique({ where: { id: numericId } });
}

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const item = await findProject(id);
  if (!item) return NextResponse.json({ error: '项目不存在' }, { status: 404 });

  return NextResponse.json({ item });
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const existing = await findProject(id);
  if (!existing) return NextResponse.json({ error: '项目不存在' }, { status: 404 });

  try {
    const body = (await request.json()) as ProjectPayload;
    const item = await prisma.project.update({
      where: { id: existing.id },
      data: buildProjectData(body),
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
  const existing = await findProject(id);
  if (!existing) return NextResponse.json({ error: '项目不存在' }, { status: 404 });

  await prisma.project.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}
