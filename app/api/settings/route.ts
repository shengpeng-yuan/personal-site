import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getSettings, saveSettings } from '@/lib/settings';

export const runtime = 'nodejs';

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  return NextResponse.json({ settings: await getSettings() });
}

export async function PUT(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => ({}));
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: '请求数据格式不正确' }, { status: 400 });
  }

  // 只保留纯文本 / 布尔 / 字符串数组字段，避免写入非法结构
  const patch: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    if (typeof value === 'string' || typeof value === 'boolean') {
      patch[key] = value;
    } else if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
      patch[key] = value;
    }
  }

  await saveSettings(patch);
  return NextResponse.json({ settings: await getSettings() });
}
