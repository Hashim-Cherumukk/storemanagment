import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getPeople } from '@/lib/services/repository';
import { getCurrentUser } from '@/lib/actions/auth-actions';
import { canManagePeople } from '@/lib/auth/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { PeopleTable } from '@/components/people/PeopleTable';

export const metadata: Metadata = {
  title: 'Borrower Registry (People)',
  description: 'Manage students, faculty, and institutional staff eligible for equipment issuing.',
};

export default async function PeoplePage() {
  const [people, user] = await Promise.all([
    getPeople(),
    getCurrentUser(),
  ]);

  const canManage = canManagePeople(user?.role);

  return (
    <div className="space-y-6">
      <PageHeader
        title="People"
        subtext="Institutional directory of students, faculty, and department staff eligible for equipment borrowing."
        actions={
          canManage ? (
            <Link
              href="/people/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Person</span>
            </Link>
          ) : null
        }
      />

      <PeopleTable initialPeople={people} canManage={canManage} />
    </div>
  );
}
