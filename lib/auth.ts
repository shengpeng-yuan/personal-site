import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySessionToken, type SessionPayload } from './session';

/** 读取当前登录用户（未登录返回 null） */
export async function getCurrentUser(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/** 在 API 路由中使用：校验登录状态，未登录时返回 401 响应 */
export async function requireAuth(): Promise<
  { ok: true; user: SessionPayload } | { ok: false; response: Response }
> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      response: Response.json({ error: '未登录或登录已过期' }, { status: 401 }),
    };
  }
  return { ok: true, user };
}
