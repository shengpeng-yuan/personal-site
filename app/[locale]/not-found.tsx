import Link from 'next/link';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container flex min-h-[70vh] flex-col items-center justify-center text-center">
      <p className="text-6xl font-bold tracking-tight gradient-text">404</p>
      <Compass className="mt-6 h-7 w-7 text-muted" />
      <h1 className="mt-4 text-2xl font-semibold">页面走丢了 / Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        你访问的页面不存在或已被移除。The page you are looking for does not exist or has been removed.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/zh" className="btn btn-primary">
          回到首页
        </Link>
        <Link href="/en" className="btn btn-ghost">
          Back to home
        </Link>
      </div>
    </div>
  );
}
