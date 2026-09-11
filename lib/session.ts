import { SignJWT, jwtVerify } from 'jose';

// 该文件不依赖 next/headers，可在 middleware（Edge Runtime）中安全使用
export const SESSION_COOKIE = 'site_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 天

export type SessionPayload = {
  userId: number;
  username: string;
};

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('缺少环境变量 JWT_SECRET，请在 .env 中配置');
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token?: string): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.userId !== 'number' || typeof payload.username !== 'string') {
      return null;
    }
    return { userId: payload.userId, username: payload.username };
  } catch {
    return null;
  }
}
