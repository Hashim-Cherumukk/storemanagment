import React from 'react';
import { Metadata } from 'next';
import { getInstitutionSettings } from '@/lib/services/repository';
import { getCurrentUser } from '@/lib/actions/auth-actions';
import { canManageSettings } from '@/lib/auth/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { SettingsManager } from '@/components/settings/SettingsManager';

export const metadata: Metadata = {
  title: 'Settings | Store Operations',
  description: 'Manage institutional profile, account roles, and system configuration.',
};

export default async function SettingsPage() {
  const [settings, user] = await Promise.all([
    getInstitutionSettings(),
    getCurrentUser(),
  ]);

  const canEdit = canManageSettings(user?.role);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtext="Institutional identification, operator access credentials, and store configuration."
      />

      <SettingsManager
        settings={settings}
        currentUser={user}
        canEditSettings={canEdit}
      />
    </div>
  );
}
