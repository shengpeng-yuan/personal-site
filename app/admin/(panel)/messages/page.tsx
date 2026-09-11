import { MessagesPanel, type MessageRow } from '@/components/admin/MessagesPanel';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminMessagesPage() {
  const messages = await prisma.message.findMany({ orderBy: { createdAt: 'desc' } });

  const items: MessageRow[] = messages.map((message) => ({
    id: message.id,
    name: message.name,
    email: message.email,
    content: message.content,
    read: message.read,
    createdAt: formatDate(message.createdAt, 'zh'),
  }));

  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">访客留言</h1>
        <p className="mt-1.5 text-sm text-muted">来自「关于我」页面联系表单的留言</p>
      </header>

      <div className="mt-6">
        <MessagesPanel items={items} />
      </div>
    </div>
  );
}
