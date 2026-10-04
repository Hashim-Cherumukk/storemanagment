import React from 'react';
import { Metadata } from 'next';
import { getAuditLogs } from '@/lib/services/repository';
import { PageHeader } from '@/components/ui/PageHeader';
import { AuditTable } from '@/components/audit/AuditTable';

export const metadata: Metadata = {
  title: 'Activity History & Audit Log',
  description: 'Complete trustworthy record of store inventory changes, issue transactions, and administrative actions.',
};

export default async function AuditLogPage() {
  const auditLogs = await getAuditLogs();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity History"
        subtext="Immutably recorded institutional audit log of store transactions, inventory modifications, and status changes."
      />

      <AuditTable initialLogs={auditLogs} />
    </div>
  );
}
