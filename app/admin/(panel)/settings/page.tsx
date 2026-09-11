import { PasswordForm } from '@/components/admin/PasswordForm';
import { SettingsForm } from '@/components/admin/SettingsForm';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <div>
      <SettingsForm initial={settings} />
      <div className="mx-auto mt-6 max-w-4xl">
        <PasswordForm />
      </div>
    </div>
  );
}
