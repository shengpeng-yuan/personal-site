import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const runtime = 'nodejs';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 访客提交留言（公开接口） */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = String(body?.name ?? '').trim();
  const email = String(body?.email ?? '').trim();
  const content = String(body?.content ?? '').trim();

  if (!name || !email || !content) {
    return NextResponse.json({ error: '请填写完整信息' }, { status: 400 });
  }
  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 });
  }
  if (name.length > 60 || email.length > 120 || content.length > 2000) {
    return NextResponse.json({ error: '内容长度超出限制' }, { status: 400 });
  }

  const item = await prisma.message.create({ data: { name, email, content } });
  return NextResponse.json({ ok: true, id: item.id }, { status: 201 });
}

/** 后台查看留言列表 */
export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const items = await prisma.message.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ items });
}
