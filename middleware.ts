import { NextResponse, type NextRequest } from 'next/server';
import { defaultLocale, locales } from './lib/i18n';
import { SESSION_COOKIE, verifySessionToken } from './lib/session';

const PUBLIC_FILE = /\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json|webmanifest)$/i;

function detectLocale(request: NextRequest) {
  const header = request.headers.get('accept-language') ?? '';
  for (const part of header.split(',')) {
    const code = part.split(';')[0].trim().toLowerCase();
    if (code.startsWith('zh')) return 'zh';
    if (code.startsWith('en')) return 'en';
  }
  return defaultLocale;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 静态资源与 Next 内部请求直接放行
  if (pathname.startsWith('/_next') || pathname.startsWith('/uploads') || PUBLIC_FILE.test(pathname)) {
    return NextResponse.next();
  }

  // 后台路由鉴权（登录页除外）
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') return NextResponse.next();

    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const session = await verifySessionToken(token);
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.search = pathname === '/admin' ? '' : `?from=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // 接口路由在各自的 handler 内做鉴权
  if (pathname.startsWith('/api')) return NextResponse.next();

  // 语言前缀处理：没有前缀时重定向到对应语言
  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (!hasLocale) {
    const locale = pathname === '/' ? detectLocale(request) : defaultLocale;
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
