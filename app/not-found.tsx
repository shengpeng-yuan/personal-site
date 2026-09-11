import Link from 'next/link';

export default function RootNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <p className="text-6xl font-bold tracking-tight gradient-text">404</p>
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
