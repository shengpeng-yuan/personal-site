import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');

  const unreadCount = await prisma.message.count({ where: { read: false } });

  return (
    <AdminShell username={user.username} unreadCount={unreadCount}>
      {children}
    </AdminShell>
  );
}
