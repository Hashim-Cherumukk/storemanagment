import React from 'react';
import { Metadata } from 'next';
import { getIssues, getIssueById } from '@/lib/services/repository';
import { NewReturnForm } from '@/components/returns/NewReturnForm';

export const metadata: Metadata = {
  title: 'Record Return',
  description: 'Record item returns from students and staff.',
};

export default async function NewReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ issue_id?: string }>;
}) {
  const { issue_id } = await searchParams;

  // If arriving from an issue page, pre-load that issue
  const preloadedIssue = issue_id ? await getIssueById(issue_id) : null;

  // Get all active/partial issues for the dropdown
  const activeIssues = await getIssues().then((issues) =>
    issues.filter((i) => i.status === 'ACTIVE' || i.status === 'PARTIALLY_RETURNED')
  );

  return (
    <div className="max-w-3xl mx-auto">
      <NewReturnForm activeIssues={activeIssues} preloadedIssue={preloadedIssue} />
    </div>
  );
}
