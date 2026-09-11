import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken } from '@/lib/session';

export const runtime = 'nodejs';

// 登录限流：同一 IP 10 分钟内最多 10 次失败尝试
const attempts = new Map<string, { count: number; first: number }>();
const WINDOW = 10 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function isRateLimited(ip: string) {
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record || now - record.first > WINDOW) {
    attempts.set(ip, { count: 0, first: now });
    return false;
  }
  return record.count >= MAX_ATTEMPTS;
}

function recordFailure(ip: string) {
  const record = attempts.get(ip);
  if (record) record.count += 1;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: '尝试次数过多，请稍后再试' }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const username = String(body?.username ?? '').trim();
  const password = String(body?.password ?? '');

  if (!username || !password) {
    return NextResponse.json({ error: '请输入用户名和密码' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !valid) {
    recordFailure(ip);
    return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
  }

  attempts.delete(ip);

  const token = await createSessionToken({ userId: user.id, username: user.username });
  const response = NextResponse.json({ ok: true });

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
    // 生产环境默认仅在 HTTPS 下发送 Cookie；若先用 http 调试可设置 COOKIE_SECURE=false
    secure: process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'false',
  });

  return response;
}
